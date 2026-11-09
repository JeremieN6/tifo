# CLAUDE.md -- Memoire Projet

> Ce fichier est lu automatiquement par l'IA au debut de chaque conversation.
> Mets-le a jour a la fin de chaque session de travail.

---

## Objectif Final
SaaS Next.js permettant de generer des affiches/posters football (annonces de transfert/mercato, evenements, competitions type Coupe du Monde) a partir de logos de clubs, avec comptes utilisateurs, quotas par plan, facturation Stripe et back-office admin.

---

## Stack Technique
- **Framework** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth** : NextAuth + bcryptjs, middleware de protection sur `/create`, `/dashboard`, `/account`, `/admin`
- **Base de donnees** : PostgreSQL (Neon serverless, `@neondatabase/serverless` + `pg`), schema dans `db/*.sql`
- **Paiement** : Stripe (checkout, customer portal, webhooks, quotas par plan Starter/Pro/Club)
- **Generation d'images** : OpenAI `gpt-image-2` par defaut, surchargeable via `OPENAI_IMAGE_MODEL` (`gpt-image-1` retire de l'API le 2026-10-28 : erreur 400 "model does not exist") (tailles natives 1024x1024, 1024x1536, 1536x1024) + `sharp` pour recadrer/redimensionner vers le format choisi (carre, story, banniere X, miniature YouTube) + `@vercel/blob` pour le stockage uniquement (PAS l'hebergement), logos clubs via Wikidata / TheSportsDB / API-Football avec fallback placeholder
- **Email** : Resend + nodemailer (relances trial, notifications admin, templates admin : `generation_incident_resolved`, `activation_nudge`, custom)
- **Analytics** : PostHog (client `posthog-js` + serveur `posthog-node`), projet "Default project" id 162607 (EU), partage avec d'autres apps
- **Blog / GEO** : articles Q&R avec `faq_json` + JSON-LD FAQPage (`lib/blog.ts`, `lib/seo.ts`, `app/blog/[slug]/page.tsx` en `force-dynamic`), apercu brouillon reserve aux admins, pipeline OpenAI + cron (`/api/cron/blog-articles`) toujours dans le repo, SQL dans `db/blog_automation.sql`
- **Hebergement / Deploiement** : VPS Hostinger (PM2 mode fork, process `tifo`, nginx reverse proxy vers le port 3000, Let's Encrypt). GitHub Actions (`.github/workflows/deploy.yml` : SSH, `git reset --hard`, `npm ci`, `rm -rf .next`, `npm run build`, `pm2 reload tifo --update-env` ; `trial-lifecycle-cron.yml`). Le projet Vercel `tifo` est un reste inactif qui ne sert aucun trafic (ses mails d'echec de deploiement sont a couper cote Vercel).

---

## Etat Actuel du Projet
**Phase** : En production sur VPS, premier client payant (plan Pro, 2026-09-30), phase d'acquisition (blog/GEO + cold DM Instagram)
**Derniere session** : 2026-11-04
**Progression globale** : 80%

### Ce qui est fait :
- [x] Scaffold Next.js 14 complet (10 pages, 14 routes API, middleware, libs auth/db/billing/admin)
- [x] Integration PostHog client + serveur, events cles instrumentes (signup/login/generation/checkout/subscription)
- [x] Facturation Stripe : checkout, redirection post-paiement, facture telechargeable, annulation via Customer Portal
- [x] Back-office admin : gestion utilisateurs, changement de plan, toggle role admin, notifications email, logging des actions admin + historique utilisateur
- [x] Systeme de gestion des trials (relances email + cron `trial-lifecycle-cron.yml`)
- [x] Page Create : type d'evenement dynamique, equipe B optionnelle hors transfert/mercato, recherche de clubs fiable (Wikidata) + auto-remplissage logos avec fallback en cascade
- [x] Direction artistique renforcee pour les posters transfert/mercato (variations lumiere/composition/typo/texture), ajout de la competition "Coupe du Monde"
- [x] SEO : `robots.txt` + `sitemap.xml` generes, balise de verification Google Search Console
- [x] Blog automatise : schema SQL (`blog_article_queue`, `blog_articles`), service de generation OpenAI, endpoint cron, pages publiques `/blog` et `/blog/[slug]`, sitemap/nav branches
- [x] CI/build : ESLint bypass configure pendant le build de prod (`next.config.mjs` ne bloque pas le build sur erreurs ESLint), erreurs `no-explicit-any` corrigees
- [x] Node 22.22.0 + shim `unzip` sur le poste local pour le wizard PostHog
- [x] Mise en production sur VPS + paiement Stripe reel : premier abonnement Pro le 2026-09-30 (verifie cote Stripe)
- [x] Incident generation du 2026-09-30 corrige : classification des erreurs OpenAI (`openai_no_credits`, `openai_connection_error`), double comptage des events PostHog supprime (capture cote serveur uniquement, `network_error` garde cote client), limites nginx relevees (timeout 300s, `client_max_body_size`), bandeau de progression + garde `beforeunload` sur `/create`
- [x] Selecteur de format de sortie fonctionnel (`OUTPUT_FORMATS`, `cropToFormat` via `sharp`) ; Starter limite au carre 1:1, Story/Banniere X/Thumbnail YouTube reserves Pro et Club
- [x] Blog GEO : 5 articles Q&R publies en base Neon (recrutement, transfert/mercato, evenements, formats d'affiche, Canva vs IA), FAQPage JSON-LD, canonical via `lib/seo.ts`, sitemap/robots centralises (`/create`, `/dashboard`, `/account` exclus du sitemap), indexation demandee dans Google Search Console
- [x] Deploiement durci : `rm -rf .next` avant le build (un cache `.next` perime servait des 404 sur les nouveaux articles apres un changement ISR -> force-dynamic)
- [x] Alertes PostHog refaites (2026-10-03) : les anciennes alertes de taux relatif (`relative_decrease`) se declenchaient chaque jour creux (0/0 = 0 %). Desactivees (reglages conserves) : "Drop checkout > 20%", "Drop activation generation > 25%", "Spike erreurs generation > 40%". Actives, en valeur absolue et quotidiennes : "Echecs generation > 3/jour" (insight `tbODocLH`) et "Echec checkout (>=1/jour)" (insight `gbYic7g1`, cree pour l'occasion)

### Prochaines etapes :
- [ ] URGENT : valider `gpt-image-2` par une generation reelle sur le site (aucune generation observee dans PostHog depuis le correctif du 2026-10-28). Les comptes 15 et 17 (premiere generation echouee le 2026-10-28) ont deja recu le mail d'incident resolu.
- [ ] 2026-11-09 : 5 echecs de renouvellement du compte 13 (30/10 a 08/11), tous `card_declined` code 51 (banque, pas le site). Le webhook Stripe fonctionne : livraisons en HTTP 200 et events PostHog `subscription_payment_failed` bien recus (04/11, 06/11, 08/11 ; prochaine tentative Stripe 10/11 17:11 UTC). Logs serveur : `[webhook/stripe] evenement recu` pour chaque evenement. Evenements Stripe a cocher sur l'endpoint : `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated` (traite `unpaid`/`incomplete_expired` comme une fin d'abonnement), `invoice.payment_failed`. Lien du portail sur `/account` renomme "Gerer mon abonnement et mon moyen de paiement". Mail au client envoye le 2026-11-09. Reste : verifier que Stripe ANNULE l'abonnement apres la derniere relance.
- [ ] Suivre le renouvellement du compte 13 (event `subscription_ended` attendu si Stripe annule l'abonnement)
- [ ] Retester la visibilite GEO vers le 2026-10-10 (requetes ChatGPT/Perplexity : recrutement, mercato/transfert, Canva vs IA, formats) ; a la date du 2026-10-03 seul l'article recrutement ressort en #1, les autres ne sont pas encore cites (concurrents vus : `mon-mercato.fr`, `pippit.ai`)
- [ ] Verifier le trafic blog venant des canaux IA dans PostHog apres 1 a 2 semaines (ne pas conclure avant)
- [ ] Couper les mails d'echec de deploiement Vercel (Vercel -> Settings -> Notifications) ; suppression du projet Vercel NON autorisee sans confirmation explicite
- [ ] Marquer les comptes de test (dont celui du proprietaire) comme internes dans PostHog pour que les chiffres checkout/generation soient exploitables sans tri manuel
- [ ] Tester 10 generations transfert pour valider la non-repetition visuelle
- [ ] Creer les dashboards PostHog (`tasks/posthog-dashboard-setup.md`) en retirant du blueprint les alertes de taux relatif
- [ ] Verifier le domaine d'envoi Resend (SPF/DKIM) et le webhook Stripe de production
- [ ] Ajouter de nouveaux articles de blog selon les resultats du retest GEO

### Statut PostHog
- Le code et la configuration sont en place et coherents avec les variables d'environnement locales.
- `doctor` retourne bien `Found 2 active issues`, mais `audit` reste un TUI interactif qui requiert un vrai terminal pour terminer la derniere etape `Continue`.
- Le blocage `spawnSync unzip ENOENT` est resolu dans le poste courant via `tools/unzip.cmd`.

---

## Blocages et Points d Attention
- Le wizard PostHog ne se termine pas correctement via taches/pipes car Ink requiert un vrai TTY interactif; la derniere etape doit etre validee dans un terminal humain.
- Le build de production bypasse le blocage ESLint (`next.config.mjs`/config build) : ne pas se fier uniquement a `npm run build` qui passe pour juger la qualite du code, executer `npm run lint` separement.
- Les tables blog existent en base Neon prod (projet `cool-math-47424110`, branche unique "production") et contiennent 5 articles inseres a la main ; le cron de generation automatique du blog n'a pas ete verifie en run reel.
- Volume tres faible : l'alerte sur un taux (ratio) est du bruit tant qu'il y a quelques evenements par jour. Preferer des seuils absolus sur des compteurs d'echecs.
- Les chiffres PostHog bruts melangent tests du proprietaire et vrais utilisateurs : avant de conclure a un signal (ex: nombre de checkouts), compter les personnes distinctes et exclure les tests. Le 2026-10-03, 11 `checkout_started` = 2 personnes seulement, dont une tres probablement le proprietaire.
- Le bac a sable de l'IA ne peut pas joindre le VPS ni envoyer d'emails reels (pas de `.env.local`) : envois (templates admin) et commandes VPS faits par l'utilisateur.
- Derriere nginx, `req.url` / `req.nextUrl.origin` valent `http://localhost:3000` : ne JAMAIS s'en servir pour des redirections ou des URLs de retour Stripe. Utiliser `getPublicOrigin(req)` / `publicUrl(req, path)` de `lib/app-url.ts` (env `APP_URL` > `NEXT_PUBLIC_APP_URL` > `NEXTAUTH_URL`, ignorees si localhost en production, puis en-tetes `x-forwarded-*`). Les liens vers des routes `/api/...` doivent etre des `<a>` et pas des `<Link>` : `<Link>` les precharge, ce qui declenchait des creations de sessions Stripe et des events `checkout_started` parasites (probable cause des 11 checkouts de 2 personnes).
- Stripe : un `stripe_customer_id` stocke peut venir d'un autre mode (ex: client cree en mode test en mai, cle de production ensuite) -> `No such customer`. `resolveOrCreateStripeCustomer` (`lib/stripe.ts`) verifie maintenant l'existence et recree le client si besoin. Portail client Stripe a activer en mode production (Parametres > Billing > Portail client) : fait et valide le 2026-11-09 (bouton de `/account` ouvre bien le portail, retour sur le vrai domaine).
- PostHog MCP : le projet actif du connecteur peut changer (un projet `clippeak`, id 328119, a ete cree le 2026-10-30 et est devenu le projet actif). Le projet de Tifo est **"Default project" id 162607**. TOUJOURS verifier avec `project-get` (ou `switch-project` 162607) avant toute analyse PostHog : un resultat vide avec des avertissements de taxonomie signifie souvent le mauvais projet. Le 2026-11-09 une conclusion fausse ("aucun event de facturation recu") venait de ce piege.
- Eviter toute exposition de secrets hors `.env.local`.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|
| 2026-05-13 | Remplacer TheSportsDB par une recherche clubs-only via Wikidata pour l'autocomplete de clubs | TheSportsDB renvoyait des resultats non pertinents (ex: Arsenal pour n'importe quel club) |
| 2026-05-13 | Ne jamais utiliser `P18` (photo generique Wikidata) comme fallback de logo | Un logo absent est preferable a une image trompeuse (photo de stade) |
| 2026-05-26 | Ne pas activer automatiquement l'offre trial Club de 90 jours au signup | Offre reservee a un segment cible (clubs), doit rester une attribution manuelle backoffice |
| 2026-06-25 | Bypasser ESLint pendant le build de production | Le build VPS echouait sur des regles ESLint alors que le code fonctionnait ; lint reste execute separement en local/CI |
| 2026-10-01 | Supprimer la capture client des events `poster_generation_failed`/`succeeded` (garder le serveur) | Chaque generation etait comptee deux fois dans PostHog |
| 2026-10-01 | `rm -rf .next` systematique dans le deploiement | Cache de routes perime apres un changement de mode de rendu (404 sur nouveaux articles) |
| 2026-10-02 | Miser sur le GEO (articles Q&R + FAQPage) comme canal d'acquisition a tester | Le premier client est arrive via `utm_source=chatgpt.com` ; a ne pas generaliser a partir d'un seul cas |
| 2026-10-03 | Remplacer les alertes PostHog de taux relatif par des alertes absolues sur les echecs (anciennes desactivees, pas supprimees) | Faux positifs quotidiens a faible volume (0/0 = 0 %, -100 % vs la veille) |

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-10-19: ajout de la telemetrie de couts OpenAI vers le dashboard Sassify Ops (projet `ops`) : nouveau `lib/ops-cost.ts` (copie du client canonique `ops/clients/ops-cost.ts`), `getOpenAIClient()` de `lib/blog-automation.ts` et de `app/api/generate-poster/route.ts` renvoient `instrumentOpenAI(new OpenAI(...), 'tifo')` (chat.completions, images.generate, images.edit). Envoie les tokens, ops calcule le cout (gpt-4.1-mini et gpt-image-1 tarifes). Fire-and-forget, sans effet tant que `OPS_URL` et `OPS_INGEST_KEY` ne sont pas definis dans le `.env` du VPS. `tsc` et `eslint` propres sur les fichiers touches. Non couvert : streaming ; si l'API images ne renvoie pas `usage`, l'appel est compte a 0 avec un drapeau visible sur le dashboard.
- 2026-11-03: Renouvellement du 1er client Pro (compte 13) refuse par sa banque (code 51, fonds insuffisants), pas un bug du site. Le webhook Stripe (`lib/stripe-webhook.ts`) ne traitait que `checkout.session.completed` : une resiliation via le portail ou une annulation apres relances laissait le Pro illimite indefiniment. Ajout de `customer.subscription.deleted` (retour en Starter, sauf autre abonnement actif/trialing/past_due du meme client ; event PostHog `subscription_ended`) et `invoice.payment_failed` (acces conserve pendant les relances Stripe ; event `subscription_payment_failed`). A cocher cote Stripe dans les evenements du webhook. Generation : `gpt-image-1` retire par OpenAI le 2026-10-28, bascule sur `gpt-image-2` via `OPENAI_IMAGE_MODEL` (2 nouveaux inscrits touches, comptes 15 et 17).
- 2026-05-26: PostHog implemente et valide techniquement. Build OK, Node 22.22.0 disponible, shim `unzip` ajoute au PATH, et le wizard arrive bien a l'etape d'audit. Limite restante: la fin du wizard requiert un vrai TTY interactif; les tasks/pipes ne suffisent pas. Voir `tasks/handoff-posthog-2026-05-26.md` pour reprise si verification manuelle souhaitee.
- 2026-08-27: Mise a jour de la memoire projet (CLAUDE.md + creation de STORY.md). CLAUDE.md n'avait pas ete touche depuis le 2026-05-26 alors que ~20 commits de fond avaient eu lieu entretemps (trial management, back-office admin complet, blog automatise, SEO, DA posters transfert, fix CI ESLint). Contenu reconstitue et verifie contre l'historique git, `package.json`, `README.md` et `tasks/todo.md` plutot que depuis un resume de conversation.
- 2026-10-03: Session de production et d'acquisition apres le premier client payant (2026-09-30). Corrige : classification erreurs OpenAI, double comptage PostHog, limites nginx (timeout + taille de requete), selecteur de format (sharp), progression de generation, cache `.next` perime (deploy durci). Cree : 5 articles blog GEO + FAQPage + apercu admin des brouillons + helpers SEO, templates email admin (incident resolu, relance d'activation), indexation GSC demandee. PostHog : alertes de taux remplacees par des alertes d'echecs en valeur absolue. Analyse checkouts : 11 evenements = 2 personnes (un proprietaire en test, un client probable). A refaire : retest GEO vers le 2026-10-10. Vercel : projet non supprime ; la coupure des mails d'echec reste a faire par l'utilisateur (non faisable via l'API).

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.

## Regle de memoire narrative
Apres toute session impliquant une decision business, un pivot, un
changement de statut, ou un apprentissage terrain significatif (pas les
changements purement techniques), mettre a jour /STORY.md en
consequence, en plus des notes de session habituelles.
