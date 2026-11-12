# Stratégie d'acquisition : comprendre d'où viennent les clients et en trouver d'autres

> Créé le 2026-11-12. Statut : étape 1 validée, pas encore développée. Étapes 2 et 3 planifiées.
> Garde-fou : un seul client payant. Rien de ce document n'est une statistique. Ne jamais nommer ni décrire le client dans `STORY.md`.

## 1. Constat (données PostHog + test ChatGPT du 2026-11-12)

**Inscriptions enregistrées depuis août (11), par première source de visite :**
ChatGPT 7, Google 3, inconnu 1.
Les 7 venues de ChatGPT : toutes sur la **page d'accueil** (`/?utm_source=chatgpt.com`), toutes sur **mobile** (application ChatGPT), la première date du 2026-08-01, donc avant le blog et avant le démarchage Instagram. Le premier client payant (2026-09-30) en fait partie.
Limites : très petit échantillon, tests éventuels du propriétaire, signaux incomplets.

**Test ChatGPT (conversation temporaire, 2026-11-12) :** question « comment faire des tifo de foot en ligne, en gros des affiches de match de foot pour mon club ? »
- Tifo est cité **en 2e position**, après Canva, dans une section « Encore plus rapide », avec le lien `https://tifo.sassify.fr/?utm_source=chatgpt.com`. C'est ChatGPT qui ajoute lui-même le paramètre : l'attribution par UTM est fiable (sauf copier-coller du lien).
- La description reprend presque mot pour mot le texte de `components/HeroSection.tsx` (derby, finale, match décisif) et mentionne les formats carré et Story. **La page d'accueil est la source de ce que ChatGPT dit de Tifo.**
- ChatGPT conclut « pour ton club, je partirais sur Canva si tu veux garder exactement le même style chaque semaine ». **L'objection à lever est la cohérence de style d'une semaine à l'autre**, pas la vitesse.
- L'utilisateur a écrit « tifo » comme nom commun (banderole de supporters) : avantage de visibilité, mais risque de confusion avec les tifos d'ultras.
- Limites : une seule requête, un seul jour, conversation temporaire, un seul modèle. Les réponses varient.
- Transcription : `tasks/geo-tests/2026-11-12-chatgpt-affiche-club.md`.

## 2. Décisions

**Où stocker :** la base du site est la source de vérité, PostHog sert à l'analyse.
- Base : l'attribution (source, page d'arrivée, appareil) et surtout les réponses libres. Raisons : donnée fiable côté serveur (PostHog peut être bloqué par le navigateur), jointure directe avec le plan et les paiements, réponses de clients que le site doit pouvoir exporter et supprimer lui-même (RGPD).
- PostHog : une propriété `acquisition_channel` sur la personne et un événement `acquisition_survey_answered` (canal seulement, **jamais le texte libre**) pour le tableau de bord « arrivées par source ».

**Questionnaire dans le produit :** une fenêtre (popup) **après la première génération réussie**, avec un remerciement à la fin. Jamais bloquante, fermable, affichée une seule fois par compte. Seulement pour les comptes créés **après** la mise en ligne (le client actuel n'est pas sollicité).

## 3. Étape 1 : mesurer (à développer, rien de visible avant la première génération)

1. **Capture first-touch** : un petit script mémorise à la première visite (cookie ou stockage local) l'UTM, le domaine de provenance, la page d'arrivée et l'appareil, puis les envoie avec le formulaire d'inscription. Enregistrement en base (nouvelle table `user_attribution`).
2. **Popup après la 1re génération réussie** (table `acquisition_survey`) :
   - Q1 : « Où avez-vous connu Tifo ? » Choix : ChatGPT, Google, Instagram, un proche, autre (avec précision).
   - Q2 facultative et adaptée à la réponse : « Qu'avez-vous demandé à {ChatGPT} qui vous a amené sur Tifo ? » (variante Google : « Qu'avez-vous tapé dans Google ? »). Phrase d'accompagnement : « Facultatif, ça nous aide à mieux répondre aux clubs comme le vôtre. »
   - Remerciement après validation.
3. **PostHog** : tableau de bord « Arrivées par source » (UTM / domaine de provenance, mobile vs ordinateur) et marquage des comptes de test comme internes.

## 4. Étape 2 : comprendre (mi-décembre, après le renouvellement du 30/11)

Un **e-mail personnel de Jérémie** avec un **lien unique** vers une page de questionnaire :
- Lien `/avis/<jeton>` : jeton aléatoire non devinable (stocké haché), à usage unique, valable 30 jours, sans connexion, non indexé. Généré depuis l'admin, e-mail envoyé avec le modèle « custom ».
- Questions (7 maximum, toutes facultatives, environ 3 minutes) :
  1. Où avez-vous connu Tifo ?
  2. Qu'avez-vous demandé à {source} qui vous a amené sur Tifo ? (formulation douce, jamais « montrez-moi la conversation »)
  3. Qu'utilisiez-vous avant pour vos affiches ?
  4. Pour quel usage utilisez-vous Tifo, et à quel rythme ?
  5. Qu'est-ce que Tifo vous apporte le plus aujourd'hui ?
  6. Qu'est-ce qui vous a donné envie de passer au plan Pro ? (remplace l'ancienne formulation « plutôt que rester en gratuit », jugée maladroite)
  7. Y a-t-il quelque chose qui vous a freiné, déçu ou qui vous manque ?
- Ne parler des difficultés de paiement que si le client les évoque. Ne solliciter qu'une fois.

## 5. Étape 3 : reproduire

- **Test hebdomadaire** : poser les mêmes requêtes dans l'application ChatGPT (conversation temporaire et connecté), noter si Tifo est cité, sa position, la description, le lien, les concurrents. Fichiers dans `tasks/geo-tests/AAAA-MM-JJ-*.md`. Requêtes de base :
  1. comment faire des tifo de foot en ligne, affiches de match pour mon club
  2. générateur d'affiche de match de foot pour club amateur
  3. alternative à Canva pour faire des affiches de foot
  4. créer une annonce de transfert / mercato pour mon club
  5. quel format d'affiche foot pour Instagram story
- **Page d'accueil** (c'est elle que ChatGPT lit) : mettre en avant la réponse à l'objection « même style chaque semaine » : images de référence (style, palette, composition) + logos auto-remplis. Vérifier la cohérence de la page avec les formats réellement proposés (la section fonctionnalités cite une « bannière Facebook » qui n'existe pas).
- Le blog reste un second levier, sans l'étendre avant les réponses de l'étape 2.

## 6. Calendrier

| Quand | Quoi |
|---|---|
| Dès validation | Étape 1 (développement) + premier test hebdomadaire noté |
| Chaque semaine | Test ChatGPT et notes |
| 30/11 | Renouvellement du client : vérifier le paiement |
| Mi-décembre | Étape 2 : e-mail avec lien unique |
| Début janvier | Bilan et décisions |
