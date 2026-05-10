# Todo -- Taches en cours

> Mis a jour au fil des sessions. Cocher les items termines.

---

## En cours
- [ ] Configurer les variables d'environnement (.env.local)
- [ ] Provisionner la base PostgreSQL et exécuter les SQL (db/*.sql)
- [ ] Tester le build de prod : `npm run build`
- [ ] Déployer sur Hostinger VPS

## Fait
- [x] Initialisation MCP memoire + structure projet
- [x] Scaffold complet du projet Next.js 14 (App Router, TypeScript, Tailwind)
- [x] 10 pages : /, /create, /dashboard, /account, /admin, /auth/login, /auth/register, /auth/forgot-password, /auth/reset-password, /checkout/success
- [x] 14 routes API couvrant auth, génération, quota, billing, admin, webhooks
- [x] Lib : db, auth, users, billing, pricing, email, password-reset, poster-history, admin, admin-analytics
- [x] 4 fichiers SQL (auth, billing, poster_history, password_reset_tokens)
- [x] Middleware protection routes (/create, /dashboard, /account, /admin)
- [x] TypeScript 0 erreur, npm install OK
