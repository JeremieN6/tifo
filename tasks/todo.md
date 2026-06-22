# Todo -- Taches en cours

> Mis a jour au fil des sessions. Cocher les items termines.

---

## En cours
- [x] [Session] Renforcer la DA transfert/mercato (prompt premium + variations de lumière/composition/typo/texture)
- [ ] [Session] Tester 10 générations transfert pour valider la non-répétition visuelle
- [x] [Session] Finaliser `posthog wizard doctor/audit` sur poste non restreint (configuration validée; la dernière étape du wizard reste TTY interactif)
- [x] [Session] Créer le blueprint dashboards PostHog (acquisition/activation/revenue)
- [x] [Session] Ajouter PostHog client global (provider + pageviews + identify)
- [x] [Session] Instrumenter les événements clés (signup/login/create/checkout/webhook)
- [x] [Session] Documenter les variables d'environnement PostHog + valider TypeScript
- [x] [Session] Stripe checkout : redirection post-paiement vers l'app
- [x] [Session] Account : bouton "Télécharger ma facture"
- [x] [Session] Account : annulation via Stripe Customer Portal
- [x] [Session] Dashboard : CTA contextuel selon plan (starter/pro/club)
- [x] [Session] Dashboard : clarifier la carte "Activité récente"
- [x] [Session] Vérification rapide TypeScript/lint sur la page dashboard
- [x] [Session] Create : type d'événement + labels dynamiques (De/À ou Équipe A/B)
- [x] [Session] Create : équipe B optionnelle hors recrutement/transfert + validation API alignée
- [x] [Session] Create : recherche clubs fiable + auto-remplissage des logos
- [x] [Session] Create : fallback logos TheSportsDB / API-Football / placeholder
- [ ] Tester les parcours complets en local (signup/login/génération/upgrade/reset password)
- [ ] Déployer sur Hostinger VPS
- [ ] Configurer les variables d'environnement de production (Hostinger)
- [ ] Configurer le webhook Stripe vers l'URL de production
- [ ] Vérifier le domaine d'envoi Resend (SPF/DKIM + sender)
- [ ] Faire un test de paiement réel (petit montant) puis remboursement

## Fait
- [x] Initialisation MCP memoire + structure projet
- [x] Scaffold complet du projet Next.js 14 (App Router, TypeScript, Tailwind)
- [x] 10 pages : /, /create, /dashboard, /account, /admin, /auth/login, /auth/register, /auth/forgot-password, /auth/reset-password, /checkout/success
- [x] 14 routes API couvrant auth, génération, quota, billing, admin, webhooks
- [x] Lib : db, auth, users, billing, pricing, email, password-reset, poster-history, admin, admin-analytics
- [x] 4 fichiers SQL (auth, billing, poster_history, password_reset_tokens)
- [x] Middleware protection routes (/create, /dashboard, /account, /admin)
- [x] TypeScript 0 erreur, npm install OK
- [x] Variables d'environnement locales configurées (.env.local)
- [x] Base Neon provisionnée + tables créées
- [x] Build de production validé (`npm run build`)
- [x] Webhook Stripe sécurisé (vérification de signature)
- [x] PostHog validé côté configuration projet (Node 22.22.0, `unzip` shim, doctor OK, audit TUI confirmé)
