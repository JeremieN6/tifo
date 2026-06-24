import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccess, decrementQuota } from '@/lib/billing';
import { savePosterHistory } from '@/lib/poster-history';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { captureServerEvent } from '@/lib/posthog-server';

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;

type VisualDirection = {
  profile: string;
  composition: string;
  lighting: string;
  typography: string;
  texture: string;
  cinematicDetail: string;
  safetyRule: string;
};

type AmbianceKey = 'electrique' | 'epique' | 'sobre-pro' | 'festif';

const DEFAULT_AMBIANCE: AmbianceKey = 'sobre-pro';

type VisualDirectionPools = Readonly<Record<AmbianceKey, readonly VisualDirection[]>>;

const MERCATO_DIRECTIONS: VisualDirectionPools = {
  electrique: [
    {
      profile: 'Mercato Voltage Arena',
      composition: 'portrait principal frontal + silhouette secondaire en recul + axe diagonal de vitesse du coin haut gauche au bas droit',
      lighting: 'flashs froids bleu-cyan et rim light blanc intense, contraste élevé mais propre sur le visage',
      typography: 'headline condensed ultra lisible, accents typographiques courts et agressifs, sous-lignes en capitales espacées',
      texture: 'particules d énergie fines, grain digital contrôlé, fumée nerveuse en arrière-plan',
      cinematicDetail: 'insérer blason club en grand contour lumineux et lignes dynamiques orientées vers le nom du joueur',
      safetyRule: 'éviter surcharge d effets et éviter les halos qui mangent la lisibilité du texte',
    },
    {
      profile: 'Mercato Storm Pulse',
      composition: 'double plan avec joueur net au premier plan et foule/stade compressés en arrière, cadrage légèrement contre-plongée',
      lighting: 'éclairs stylisés en fond, key light dure sur le sujet, ombres marquées pour un impact immédiat',
      typography: 'titre central monumental, micro-infos alignées en colonnes latérales, hiérarchie très tranchée',
      texture: 'traces lumineuses directionnelles, micro-halftone sombre, poussières fines en suspension',
      cinematicDetail: 'faire converger la perspective du stade vers le torse du joueur pour accentuer l effet annonce choc',
      safetyRule: 'pas d effet pinceau aléatoire ni de mix de polices incohérent',
    },
    {
      profile: 'Mercato Hyper Contrast',
      composition: 'split vertical ancien/nouveau chapitre avec sujet principal traversant la séparation, profondeur en trois plans',
      lighting: 'duo de lumières complémentaires très contrastées, reflets métalliques localisés sur les contours',
      typography: 'nom joueur oversized, second niveau en tracking large, troisième niveau minimal discret',
      texture: 'grain ciné fin, glow ponctuel localisé, fumée légère structurée par le vent',
      cinematicDetail: 'blason flou monumental en fond et rails lumineux qui accompagnent la lecture titre vers date',
      safetyRule: 'ne pas transformer l image en néon uniforme, préserver une zone de repos visuel',
    },
    {
      profile: 'Mercato Tunnel Exit',
      composition: 'sortie de tunnel avec sujet en marche au centre, silhouettes support en arrière et blocs texte ancrés en bas',
      lighting: 'contre-jour puissant de tunnel + rim cyan électrique, point chaud sur regard et buste',
      typography: 'titre compact en haut, bandeau info transfert en bas, contraste fort de taille entre niveaux',
      texture: 'fumée dense contrôlée, particules brillantes rares, rendu net premium',
      cinematicDetail: 'intégrer architecture du stade et bande lumineuse qui guide vers le nom du joueur',
      safetyRule: 'éviter bruit excessif et toute confusion entre texte principal et éléments décoratifs',
    },
  ],
  epique: [
    {
      profile: 'Mercato Heroic Monument',
      composition: 'portrait héro sculptural au centre + plans secondaires en arc de cercle pour une lecture majestueuse',
      lighting: 'lumière dorée de coucher de stade, ombres profondes cinématiques et halo noble arrière',
      typography: 'combinaison serif prestige pour nom et sans condensée pour infos, hiérarchie ample et respirante',
      texture: 'grain film organique, brume subtile, dégradés ambrés propres',
      cinematicDetail: 'monument urbain du club en fond lointain, blason intégré comme emblème quasi institutionnel',
      safetyRule: 'pas de kitsch fantasy, rester crédible et éditorial haut de gamme',
    },
    {
      profile: 'Mercato Crowned Chapter',
      composition: 'mise en scène tri-plan: sujet principal, passé en arrière diffus, futur symbolisé par ouverture lumineuse',
      lighting: 'key light dramatique frontale + backlight chaud, forts volumes sans brûler les zones claires',
      typography: 'titre solennel en capitales, intertitres raffinés, alignements stables',
      texture: 'trame papier luxe discrète, poussière dorée ténue, contraste local peau/tissu élevé',
      cinematicDetail: 'ajouter une perspective de tribunes monumentales pour donner l échelle du moment',
      safetyRule: 'interdire style cheap blockbuster et ornements gratuits',
    },
    {
      profile: 'Mercato Legacy Rise',
      composition: 'sujet plein cadre avec extension du corps hors cadre, lignes architecturales qui montent vers le titre',
      lighting: 'dramatic spotlight chaud/froid équilibré, accent sur visage et écusson',
      typography: 'nom joueur grand format, sous-titres fins, rythme vertical clair',
      texture: 'grain cinéma premium, fumée lente, relief textile maîtrisé',
      cinematicDetail: 'ancrer le club via blason monumental semi-transparent et horizon de stade épique',
      safetyRule: 'éviter aspect over-sharpened et éviter texte trop compact',
    },
    {
      profile: 'Mercato Final Overture',
      composition: 'composition symétrique noble avec sujet central, encadré par deux masses visuelles secondaires',
      lighting: 'lumière théâtrale haut/bas, contraste profond avec lecture claire des traits',
      typography: 'bloc titre haut impact, sous-infos alignées en ruban, élégance éditoriale',
      texture: 'brume de scène, grain 35mm subtil, dégradés nobles sans artefacts',
      cinematicDetail: 'placer un stade iconique en arrière-plan avec perspective grand-angle maîtrisée',
      safetyRule: 'ne jamais sacrifier la lisibilité au profit du dramatique',
    },
  ],
  'sobre-pro': [
    {
      profile: 'Mercato Boardroom Editorial',
      composition: 'portrait net demi-buste, grille éditoriale rigoureuse, zones de respiration marquées',
      lighting: 'lumière soft latérale, contraste modéré premium, rendu réaliste de la peau',
      typography: 'sans-serif sobre avec une seule famille dominante, tailles hiérarchisées sans excès',
      texture: 'micro-grain papier fin, fond propre, très faible bruit visuel',
      cinematicDetail: 'rappel club discret via blason embossé et lignes de structure inspirées des dossiers presse',
      safetyRule: 'interdire effets flashy, halos néon et surcharge décorative',
    },
    {
      profile: 'Mercato Minimal Statement',
      composition: 'sujet principal isolé sur fond structuré, colonnes d informations alignées au millimètre',
      lighting: 'éclairage uniforme maîtrisé avec légère direction, ombres douces et crédibles',
      typography: 'hiérarchie stricte, capitales mesurées, interlettrage contrôlé',
      texture: 'surface matte propre, trame quasi invisible, transitions nettes',
      cinematicDetail: 'insérer un motif de stade en filigrane géométrique sans voler l attention du sujet',
      safetyRule: 'éviter tout effet sensationnaliste et conserver une sobriété institutionnelle',
    },
    {
      profile: 'Mercato Press Kit Premium',
      composition: 'portrait central + cartouche infos en bloc latéral, équilibre éditorial de magazine sportif',
      lighting: 'key light neutre, modelé précis des volumes, haute lisibilité globale',
      typography: 'mix rationnel de graisse regular/bold, pas de typo décorative',
      texture: 'grain subtil quasi imperceptible, fond texturé léger',
      cinematicDetail: 'ancrage identitaire par détail de tribune et blason monochrome en arrière-plan',
      safetyRule: 'pas de couleurs agressives ni de rupture de style entre texte et image',
    },
    {
      profile: 'Mercato Corporate Sport',
      composition: 'mise en page claire avec axe vertical principal, priorisation de l information avant effet',
      lighting: 'lumière froide contrôlée, contraste doux, rendu premium propre',
      typography: 'titres nets, sous-texte compact, espacement généreux pour lecture immédiate',
      texture: 'surface propre avec légère matière, aucun artefact flashy',
      cinematicDetail: 'ajouter architecture de stade stylisée en contour fin pour contextualiser le club',
      safetyRule: 'éviter style affiche fan-art et éviter collages trop chargés',
    },
  ],
  festif: [
    {
      profile: 'Mercato Celebration Burst',
      composition: 'sujet principal au centre avec éventail de confettis et second plan de supporters en liesse',
      lighting: 'lumières de fête multicolores contrôlées, points chauds dynamiques, ambiance positive',
      typography: 'headline impactante et joyeuse, sous-titres rythmés, accents colorés maîtrisés',
      texture: 'confettis, fumée légère colorée, grain fin pour unité visuelle',
      cinematicDetail: 'intégrer drapeaux et rubans lumineux du club en arrière-plan pour un reveal célébration',
      safetyRule: 'éviter saturation excessive et préserver une lisibilité parfaite des infos clés',
    },
    {
      profile: 'Mercato Carnival Night',
      composition: 'plan principal frontal + scène de tribune festive en profondeur avec trajectoires courbes',
      lighting: 'projecteurs colorés croisés, ambiance chaude et énergique sans brûler les tons peau',
      typography: 'titre bold festif, labels courts, rythme typographique dynamique',
      texture: 'particules lumineuses joyeuses, micro-glow localisé, fond texturé propre',
      cinematicDetail: 'blason club animé visuellement par des arcs de lumière qui convergent vers le joueur',
      safetyRule: 'ne pas transformer la scène en patchwork, conserver un axe de lecture clair',
    },
    {
      profile: 'Mercato Fireworks Reveal',
      composition: 'sujet en avant-scène avec feux de célébration flous en fond, profondeur très lisible',
      lighting: 'éclats colorés derrière le joueur, face light neutre pour garder les détails',
      typography: 'grand titre central festif, informations secondaires en rubans propres',
      texture: 'étincelles fines, fumée festive légère, contraste local sur le sujet',
      cinematicDetail: 'ajouter gestes de foule et écharpes club pour renforcer l effet annonce triomphale',
      safetyRule: 'pas de bruit visuel excessif ni de texte noyé dans les effets',
    },
    {
      profile: 'Mercato Victory Parade',
      composition: 'cadre large avec joueur au premier plan et cortège visuel festif au second, structure diagonale montante',
      lighting: 'lumière vive et chaleureuse, reflets colorés sur les bords, tonalité joyeuse',
      typography: 'typo expressive mais propre, hiérarchie claire entre nom, annonce et détails',
      texture: 'confettis fins, glow ponctuel, rendu premium net',
      cinematicDetail: 'incorporer éléments de ville/stade et identité club dans une ambiance de célébration officielle',
      safetyRule: 'éviter kitsch cartoon et préserver la crédibilité d une communication club',
    },
  ],
};

const GENERAL_DIRECTIONS: VisualDirectionPools = {
  electrique: [
    {
      profile: 'Match Pulse Reactor',
      composition: 'sujet principal en mouvement, diagonales rapides, second plan stade compressé pour sensation d urgence',
      lighting: 'éclairage électrique bleu/blanc avec pics lumineux localisés, contraste fort lisible',
      typography: 'titre condensed tranchant, sous-infos en blocs courts, rythme percutant',
      texture: 'particules dynamiques et grain numérique fin',
      cinematicDetail: 'ajouter traînées d énergie liées à la course et signalétique stade stylisée',
      safetyRule: 'pas de fouillis d effets ni de texte illisible dans les zones lumineuses',
    },
    {
      profile: 'Match High Voltage Clash',
      composition: 'duel frontal ou sujet unique avec axe central, lignes d impact convergentes vers le cœur du visuel',
      lighting: 'rim light froide intense, highlights tranchés, ombres denses contrôlées',
      typography: 'headline massive, sous-titres minimalistes, espacement agressif maîtrisé',
      texture: 'micro-fumée et étincelles discrètes, halftone léger sur les ombres',
      cinematicDetail: 'faire apparaître blasons en arrière-plan comme masses lumineuses distinctes',
      safetyRule: 'éviter surglow et éviter répétition de motifs identiques',
    },
    {
      profile: 'Match Shockwave Sprint',
      composition: 'sujet avancé au premier plan, perspective de terrain marquée, profondeur dynamique',
      lighting: 'flash latéral + contre-jour, tonalité froide nerveuse',
      typography: 'bloc titre haut impact et bandeau infos compact, hiérarchie nette',
      texture: 'grain fin, traces de vitesse lumineuses, fumée légère',
      cinematicDetail: 'intégrer marquages de pelouse et projecteurs pour renforcer l intensité du match',
      safetyRule: 'pas d empilement d éléments décoratifs concurrents',
    },
    {
      profile: 'Match Neon Kickoff',
      composition: 'sujet central avec halo d énergie elliptique et contexte stade simplifié',
      lighting: 'duo cyan/bleu électrique, forts contrastes sur contours, visage toujours lisible',
      typography: 'titre principal direct, sous-infos alignées, labels courts',
      texture: 'glow discret localisé, grain film subtil',
      cinematicDetail: 'ajouter arcs lumineux orientés vers date et lieu pour guider la lecture',
      safetyRule: 'interdire effet arcade exagéré et préserver un rendu premium',
    },
  ],
  epique: [
    {
      profile: 'Match Grand Finale',
      composition: 'sujet héroïque central, second plan monumental de stade, profondeur cinématique',
      lighting: 'lumière dorée dramatique et contre-jour noble, forts volumes',
      typography: 'titres majuscules élégants, sous-texte éditorial, respiration généreuse',
      texture: 'grain 35mm discret, brume légère, rendu noble',
      cinematicDetail: 'ajouter drapeaux et architecture emblématique pour renforcer l enjeu historique',
      safetyRule: 'éviter ton caricatural, conserver crédibilité sportive haut de gamme',
    },
    {
      profile: 'Match Legend Frame',
      composition: 'cadrage large avec sujet au tiers, lignes de tribunes conduisant vers le titre',
      lighting: 'éclairage théâtral chaud/froid équilibré, contraste maîtrisé',
      typography: 'mix serif prestige + sans structurée, hiérarchie à trois niveaux',
      texture: 'brume ciné, matière film subtile, noirs profonds propres',
      cinematicDetail: 'insérer blason club en fond monumental semi-transparent',
      safetyRule: 'pas de surcharge d effets pseudo-hollywood inutiles',
    },
    {
      profile: 'Match Hero Overture',
      composition: 'sujet en posture de défi, composition symétrique, masses visuelles équilibrées',
      lighting: 'spot principal dramatique, rim chaud discret, lisibilité globale prioritaire',
      typography: 'headline solennelle, sous-sections fines et précises',
      texture: 'grain premium modéré, brume orchestrée',
      cinematicDetail: 'intégrer horizon de stade et signalétique de compétition pour contextualiser l enjeu',
      safetyRule: 'interdire mélange de styles contradictoires',
    },
    {
      profile: 'Match Titan Night',
      composition: 'double protagoniste en opposition noble, axe vertical fort et arrière-plan monumental',
      lighting: 'contrast ratio élevé avec lueurs chaudes de foule, rendu dramatique propre',
      typography: 'titre imposant lisible, micro-infos raffinées',
      texture: 'halftone subtil, grain cinéma, nuages de fumée légère',
      cinematicDetail: 'ajouter effet de profondeur tribunes et symbole club en filigrane',
      safetyRule: 'ne pas sacrifier lisibilité des informations événementielles',
    },
  ],
  'sobre-pro': [
    {
      profile: 'Match Editorial Precision',
      composition: 'mise en page sobre, sujet isolé, espaces négatifs utiles et alignements rigoureux',
      lighting: 'lumière neutre propre, contraste modéré, rendu réaliste',
      typography: 'sans-serif institutionnelle, hiérarchie claire, pas de surcharge de graisse',
      texture: 'fond mat texturé léger, grain minimal',
      cinematicDetail: 'rappel identitaire du club discret et parfaitement intégré',
      safetyRule: 'aucun effet flashy, aucune décoration gratuite',
    },
    {
      profile: 'Match Clean Corporate',
      composition: 'grille éditoriale avec blocs informationnels nets et sujet principal détaché',
      lighting: 'éclairage homogène contrôlé, volumes doux',
      typography: 'titres structurés, micro-texte lisible, tracking maîtrisé',
      texture: 'trame légère premium, rendu net sans bruit',
      cinematicDetail: 'inclure un motif de stade géométrique très discret',
      safetyRule: 'éviter toute exagération cinématique non nécessaire',
    },
    {
      profile: 'Match Minimal Pro Kit',
      composition: 'sujet central et cartouches latéraux équilibrés, lecture immédiate de l information',
      lighting: 'key light douce et arrière-plan contrôlé',
      typography: 'style éditorial rationnel, contraste de tailles sobre',
      texture: 'surface propre, micro-grain uniforme',
      cinematicDetail: 'blason en emboss discret et lignes de terrain subtilement visibles',
      safetyRule: 'pas de confusion entre décor et information utile',
    },
    {
      profile: 'Match Studio Sport',
      composition: 'portrait net avec structure modulaire, priorisation claire du contenu',
      lighting: 'studio light sportive propre, ombres mesurées',
      typography: 'titres droits et lisibles, sous-lignes courtes et élégantes',
      texture: 'rendu lisse premium, bruit quasi nul',
      cinematicDetail: 'ajouter uniquement un contexte club léger pour ancrer le visuel',
      safetyRule: 'éviter style fan-art et excès de contrastes artificiels',
    },
  ],
  festif: [
    {
      profile: 'Match Celebration Wave',
      composition: 'sujet central et tribunes festives en arrière-plan, dynamique ascendante',
      lighting: 'éclairage joyeux multicolore contrôlé, tonalité chaude positive',
      typography: 'titre impactant convivial, sous-infos rythmées, hiérarchie nette',
      texture: 'confettis fins, glow ponctuel, grain léger',
      cinematicDetail: 'ajouter drapeaux et fumigènes colorés maîtrisés pour une énergie de fête',
      safetyRule: 'ne pas noyer le texte dans les effets festifs',
    },
    {
      profile: 'Match Color Parade',
      composition: 'scène ouverte avec sujet mis en avant et foule célébrante en profondeur',
      lighting: 'projecteurs colorés doux et équilibrés, visage toujours lisible',
      typography: 'headline expressive mais propre, labels courts et clairs',
      texture: 'particules lumineuses joyeuses et micro-fumée',
      cinematicDetail: 'intégrer accessoires supporters et identité club de manière harmonieuse',
      safetyRule: 'éviter surcharge de couleurs discordantes',
    },
    {
      profile: 'Match Festival Kickoff',
      composition: 'sujet principal en action, arc visuel de célébration autour du centre',
      lighting: 'lumières de fête en fond avec key light neutre sur le sujet',
      typography: 'titre lisible en bloc central et infos événement en bandeau stable',
      texture: 'confettis subtils, grain fin, contraste local soigné',
      cinematicDetail: 'placer éléments de stade et de club comme repères festifs premium',
      safetyRule: 'pas de rendu cartoon ni d accumulation d icônes inutiles',
    },
    {
      profile: 'Match Joyful Derby Night',
      composition: 'duel ou sujet unique avec arrière-plan de supporters lumineux et profondeur respirante',
      lighting: 'ambiance vive festive, reflets colorés modérés, exposition équilibrée',
      typography: 'mix de titres énergiques et sous-textes sobres pour garder l équilibre',
      texture: 'étincelles fines, fumée légère, finition premium',
      cinematicDetail: 'ancrer la célébration via drapeaux, tribunes et signatures visuelles club',
      safetyRule: 'préserver la clarté narrative et éviter la saturation extrême',
    },
  ],
};

function normalizeAmbiance(rawAmbiance: string): AmbianceKey {
  const normalized = (rawAmbiance ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const aliasMap: Record<string, AmbianceKey> = {
    electrique: 'electrique',
    epique: 'epique',
    festif: 'festif',
    'sobre-pro': 'sobre-pro',
    sobrepro: 'sobre-pro',
    'sobre-et-pro': 'sobre-pro',
  };

  return aliasMap[normalized] ?? DEFAULT_AMBIANCE;
}

function hashToIndex(seed: string, poolSize: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 999999;
  }
  return hash % poolSize;
}

function getVisualDirection(ambiance: string, isTransferEvent: boolean, seed: string): VisualDirection {
  const normalizedAmbiance = normalizeAmbiance(ambiance);
  const directionPools = isTransferEvent ? MERCATO_DIRECTIONS : GENERAL_DIRECTIONS;
  const pool = directionPools[normalizedAmbiance] ?? directionPools[DEFAULT_AMBIANCE];
  const safeSeed = seed?.trim() || 'club-inconnu';
  return pool[hashToIndex(safeSeed, pool.length)];
}

function toErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  return 'unknown_error';
}

function classifyGenerationError(err: unknown, stage: string) {
  const message = toErrorMessage(err).toLowerCase();

  if (message.includes('openai_api_key') || message.includes('api key')) {
    return {
      status: 500,
      reason: 'missing_openai_api_key',
      userMessage: 'Service de generation temporairement indisponible (configuration OpenAI).',
    };
  }

  if (message.includes('blob_read_write_token')) {
    return {
      status: 500,
      reason: 'missing_blob_token',
      userMessage: 'Service de stockage temporairement indisponible. Reessayez plus tard.',
    };
  }

  if (message.includes('cannot use public access on a private store')) {
    return {
      status: 500,
      reason: 'blob_private_store_mismatch',
      userMessage: 'Stockage mal configure (store Blob prive). Contactez le support.',
    };
  }

  if (message.includes('rate limit') || message.includes('quota') || message.includes('insufficient_quota')) {
    return {
      status: 429,
      reason: 'openai_rate_limited',
      userMessage: 'Le service de generation est surcharge. Reessayez dans quelques instants.',
    };
  }

  if (message.includes('connection') || message.includes('database')) {
    return {
      status: 503,
      reason: 'database_unavailable',
      userMessage: 'Service temporairement indisponible. Reessayez dans quelques instants.',
    };
  }

  return {
    status: 500,
    reason: `server_error_${stage}`,
    userMessage: 'Erreur lors de la generation. Reessayez.',
  };
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NANO_USER_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante');
  }
  return new OpenAI({ apiKey });
}

function buildPrompt(data: {
  posterType: string;
  eventType: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  style: string;
  colors: string;
  description: string;
}): string {
  const isTransferEvent = data.posterType === 'annonce' && (data.eventType === 'recrutement' || data.eventType === 'transfert');
  const visualDirection = getVisualDirection(data.style, isTransferEvent, data.homeTeam);
  const teamDescriptor = data.awayTeam
    ? `${data.homeTeam} vs ${data.awayTeam}`
    : data.homeTeam;
  const eventDescriptor = data.posterType === 'annonce'
    ? `Événement : ${data.eventType || 'annonce'}`
    : 'Événement : match';

  const transferSpecificBlock = isTransferEvent
    ? `Direction Mercato Premium (obligatoire) :
- Ambition: rendu premium comparable à une campagne de reveal officielle top club européen.
- Storytelling visuel: “nouveau chapitre”, montée en statut, impact émotionnel immédiat.
- Signature visuelle: montage photo cinématique haut de gamme, profondeur multi-plans, branding club intégré avec élégance.
- Variantes autorisées: changer intelligemment lumière, angle de portrait, structure des textes et textures pour éviter toute répétition.
- Interdits: rendu générique type template IA, grosse typo uniforme partout, surlignage pinceau systématique.`
    : '';

  return `Tu es un designer graphique expert en affiches de football. Crée une affiche de match professionnelle et visuellement impactante.

Sujet : ${teamDescriptor}
${eventDescriptor}
Date : ${data.date} à ${data.time}
Lieu : ${data.venue}
Style : ${data.style}
Couleurs : ${data.colors}
Description : ${data.description}

Profil visuel sélectionné : ${visualDirection.profile}
Composition : ${visualDirection.composition}
Lumière : ${visualDirection.lighting}
Typographie : ${visualDirection.typography}
Texture : ${visualDirection.texture}
Détail cinématique : ${visualDirection.cinematicDetail}
Règle qualité : ${visualDirection.safetyRule}

${transferSpecificBlock}

L'affiche doit être au format portrait (2:3), avec une hiérarchie visuelle claire, la date et le lieu de l'événement. Si un seul club est fourni, mets-le au centre de la composition et évite d'inventer une seconde équipe. Style graphique : ${data.style}. Rendu professionnel, premium, différenciant et non répétitif.`;
}

export async function POST(req: NextRequest) {
  let stage = 'init';
  let distinctIdForError = 'anonymous';

  try {
    stage = 'openai_client';
    const openai = getOpenAIClient();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN manquante');
    }

    stage = 'session';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      captureServerEvent({
        distinctId: 'anonymous',
        event: 'poster_generation_failed',
        properties: { reason: 'unauthenticated' },
      });
      return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    distinctIdForError = session.user.id;

    stage = 'access';
    const access = await getUserAccess(session.user.id);
    if (!access) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'access_not_found' },
      });
      return NextResponse.json({ error: 'Accès introuvable.' }, { status: 403 });
    }

    if (access.quota_remaining <= 0) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'quota_exhausted', plan: access.plan },
      });
      return NextResponse.json({ error: 'Quota épuisé. Passez au plan Pro pour continuer.' }, { status: 429 });
    }

    stage = 'parse_form';
    const formData = await req.formData();
    const homeTeam = formData.get('homeTeam') as string;
    const awayTeam = formData.get('awayTeam') as string;
    const posterType = formData.get('posterType') as string;
    const eventType = formData.get('eventType') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const venue = formData.get('venue') as string;
    const style = formData.get('style') as string;
    const colors = formData.get('colors') as string;
    const description = (formData.get('description') as string ?? '').slice(0, 1500);
    const multiReferenceFiles = formData
      .getAll('references')
      .filter((value): value is File => value instanceof File && value.size > 0);
    const legacyReference = formData.get('reference');
    const referenceFiles = multiReferenceFiles.length > 0
      ? multiReferenceFiles
      : legacyReference instanceof File && legacyReference.size > 0
        ? [legacyReference]
        : [];
    const isAnnouncement = posterType === 'annonce';
    const isTransferEvent = isAnnouncement && (eventType === 'recrutement' || eventType === 'transfert');

    if (!homeTeam) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'missing_home_team' },
      });
      return NextResponse.json({ error: 'Le premier club/équipe est requis.' }, { status: 400 });
    }
    if ((!isAnnouncement && !awayTeam) || (isTransferEvent && !awayTeam)) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'missing_away_team', poster_type: posterType, event_type: eventType },
      });
      return NextResponse.json({ error: 'Le second club/équipe est requis pour ce type d\'affiche.' }, { status: 400 });
    }

    const prompt = buildPrompt({ posterType, eventType, homeTeam, awayTeam, date, time, venue, style, colors, description });
    const settings = { posterType, eventType, homeTeam, awayTeam, date, time, venue, style, colors };

    let imageB64: string;

    if (referenceFiles.length > 0) {
      if (referenceFiles.length > MAX_REFERENCE_IMAGES) {
        return NextResponse.json({ error: `Trop d'images de référence (max ${MAX_REFERENCE_IMAGES}).` }, { status: 400 });
      }

      // Validation des images de référence
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      for (const referenceFile of referenceFiles) {
        if (!allowedTypes.includes(referenceFile.type)) {
          return NextResponse.json({ error: 'Format d\'image invalide (PNG, JPG ou WebP requis).' }, { status: 400 });
        }
        if (referenceFile.size > MAX_REFERENCE_IMAGE_BYTES) {
          return NextResponse.json({ error: 'Image trop volumineuse (max 5MB/image).' }, { status: 400 });
        }
      }

      const files = await Promise.all(
        referenceFiles.map(async (referenceFile) => {
          const bytes = await referenceFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          return new File([buffer], referenceFile.name, { type: referenceFile.type });
        }),
      );

      const extendedPrompt = `${prompt}\n\n${files.length > 1 ? 'Des images de référence sont fournies.' : 'Une image de référence est fournie.'} Inspire-toi de leur style graphique, leur palette de couleurs et leur composition. Ne reproduis PAS leur contenu (logos, visages, textes). Applique ce style à l'affiche de match demandée.`;

      stage = 'openai_image_edit';
      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: files,
        prompt: extendedPrompt,
        size: '1024x1536',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    } else {
      stage = 'openai_image_generate';
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1536',
      });

      imageB64 = response.data?.[0]?.b64_json ?? '';
    }

    if (!imageB64) {
      captureServerEvent({
        distinctId: session.user.id,
        event: 'poster_generation_failed',
        properties: { reason: 'empty_image_payload' },
      });
      return NextResponse.json({ error: 'Aucune image générée.' }, { status: 500 });
    }

    // Upload l'image vers Vercel Blob
    const buffer = Buffer.from(imageB64, 'base64');
    const filename = awayTeam
      ? `tifo-${homeTeam}-vs-${awayTeam}-${Date.now()}.png`
      : `tifo-${homeTeam}-${Date.now()}.png`;

    let imageUrl: string;
    try {
      stage = 'blob_upload';
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url;
    } catch (uploadErr) {
      const uploadMessage = toErrorMessage(uploadErr).toLowerCase();

      // Compatibility fallback: some stores are private-only and reject public uploads.
      if (uploadMessage.includes('cannot use public access on a private store')) {
        stage = 'blob_upload_fallback_data_url';
        imageUrl = `data:image/png;base64,${imageB64}`;
      } else {
        throw uploadErr;
      }
    }

    // Décrémenter le quota et sauvegarder l'historique avec l'URL
    stage = 'persist_history_and_quota';
    await Promise.all([
      decrementQuota(session.user.id),
      savePosterHistory(session.user.id, prompt, imageUrl, settings),
    ]);

    captureServerEvent({
      distinctId: session.user.id,
      event: 'poster_generation_succeeded',
      properties: {
        plan: access.plan,
        poster_type: posterType,
        event_type: eventType || 'match',
        has_away_team: Boolean(awayTeam),
        reference_images_count: referenceFiles.length,
      },
    });

    return NextResponse.json({ success: true, image: imageUrl });
  } catch (err) {
    const classification = classifyGenerationError(err, stage);

    captureServerEvent({
      distinctId: distinctIdForError,
      event: 'poster_generation_failed',
      properties: {
        reason: classification.reason,
        stage,
        error_message: toErrorMessage(err).slice(0, 200),
      },
    });

    console.error('[generate-poster]', {
      stage,
      reason: classification.reason,
      message: toErrorMessage(err),
    });

    return NextResponse.json({ error: classification.userMessage }, { status: classification.status });
  }
}
