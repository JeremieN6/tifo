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
- **Generation d'images** : OpenAI (DALL-E) + `@vercel/blob` pour le stockage, logos clubs via Wikidata / TheSportsDB / API-Football avec fallback placeholder
- **Email** : Resend + nodemailer (relances trial, notifications admin)
- **Analytics** : PostHog (client `posthog-js` + serveur `posthog-node`)
- **Blog automatise** : pipeline OpenAI + cron (`/api/cron/blog-articles`), SQL dans `db/blog_automation.sql`
- **Deploiement** : GitHub Actions (`.github/workflows/deploy.yml`, `trial-lifecycle-cron.yml`) vers VPS Hostinger

---

## Etat Actuel du Projet
**Phase** : Developpement actif (produit fonctionnel, pre-lancement production)
**Derniere session** : 2026-08-27
**Progression globale** : 65%

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

### Prochaines etapes :
- [ ] Appliquer `db/blog_automation.sql` sur la base Neon de dev/prod
- [ ] Configurer le cron host blog (1 run/jour) et verifier un premier run reel
- [ ] Tester 10 generations transfert pour valider la non-repetition visuelle
- [ ] Verifier les events dans PostHog Live Events puis creer les 3 dashboards (`tasks/posthog-dashboard-setup.md`)
- [ ] Tester les parcours complets en local (signup/login/generation/upgrade/reset password)
- [ ] Deployer sur Hostinger VPS + configurer les variables d'environnement de production
- [ ] Configurer le webhook Stripe vers l'URL de production, verifier le domaine d'envoi Resend (SPF/DKIM)
- [ ] Faire un test de paiement reel (petit montant) puis remboursement

### Statut PostHog
- Le code et la configuration sont en place et coherents avec les variables d'environnement locales.
- `doctor` retourne bien `Found 2 active issues`, mais `audit` reste un TUI interactif qui requiert un vrai terminal pour terminer la derniere etape `Continue`.
- Le blocage `spawnSync unzip ENOENT` est resolu dans le poste courant via `tools/unzip.cmd`.

---

## Blocages et Points d Attention
- Le wizard PostHog ne se termine pas correctement via taches/pipes car Ink requiert un vrai TTY interactif; la derniere etape doit etre validee dans un terminal humain.
- Le build de production bypasse le blocage ESLint (`next.config.mjs`/config build) : ne pas se fier uniquement a `npm run build` qui passe pour juger la qualite du code, executer `npm run lint` separement.
- `db/blog_automation.sql` n'est pas encore applique en base Neon dev/prod : le pipeline blog ne peut pas tourner reellement tant que ce n'est pas fait.
- Eviter toute exposition de secrets hors `.env.local`.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|
| 2026-05-13 | Remplacer TheSportsDB par une recherche clubs-only via Wikidata pour l'autocomplete de clubs | TheSportsDB renvoyait des resultats non pertinents (ex: Arsenal pour n'importe quel club) |
| 2026-05-13 | Ne jamais utiliser `P18` (photo generique Wikidata) comme fallback de logo | Un logo absent est preferable a une image trompeuse (photo de stade) |
| 2026-05-26 | Ne pas activer automatiquement l'offre trial Club de 90 jours au signup | Offre reservee a un segment cible (clubs), doit rester une attribution manuelle backoffice |
| 2026-06-25 | Bypasser ESLint pendant le build de production | Le build VPS echouait sur des regles ESLint alors que le code fonctionnait ; lint reste execute separement en local/CI |

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-05-26: PostHog implemente et valide techniquement. Build OK, Node 22.22.0 disponible, shim `unzip` ajoute au PATH, et le wizard arrive bien a l'etape d'audit. Limite restante: la fin du wizard requiert un vrai TTY interactif; les tasks/pipes ne suffisent pas. Voir `tasks/handoff-posthog-2026-05-26.md` pour reprise si verification manuelle souhaitee.
- 2026-08-27: Mise a jour de la memoire projet (CLAUDE.md + creation de STORY.md). CLAUDE.md n'avait pas ete touche depuis le 2026-05-26 alors que ~20 commits de fond avaient eu lieu entretemps (trial management, back-office admin complet, blog automatise, SEO, DA posters transfert, fix CI ESLint). Contenu reconstitue et verifie contre l'historique git, `package.json`, `README.md` et `tasks/todo.md` plutot que depuis un resume de conversation.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.

## Regle de memoire narrative
Apres toute session impliquant une decision business, un pivot, un
changement de statut, ou un apprentissage terrain significatif (pas les
changements purement techniques), mettre a jour /STORY.md en
consequence, en plus des notes de session habituelles.
