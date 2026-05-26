# Handoff Session -- PostHog (2026-05-26)

## Resume

L'integration PostHog est en place et fonctionnelle dans l'app.

Valide dans cette session:
- TypeScript OK (`npx tsc --noEmit`)
- Build Next.js OK (`npm run build`)
- Smoke tests runtime OK (`/`, `/auth/login`, `/api/auth/signup`)
- Event PostHog reel envoye avec succes (`copilot_connectivity_test` -> `POSTHOG_EVENT_SENT`)

## Blocage restant

Le wizard PostHog (`doctor` / `audit`) ne termine pas sur ce poste a cause de l'environnement:
- erreur observee: `Failed to install skill: spawnSync unzip ENOENT`
- tentative d'installation `unzip` via `winget` annulee par le poste

Ce blocage est lie au poste, pas au code de l'app.

## Fichiers touches pendant l'integration

- `components/PostHogProvider.tsx`
- `components/SessionProvider.tsx`
- `lib/analytics-client.ts`
- `lib/posthog-server.ts`
- `app/auth/register/page.tsx`
- `app/auth/login/page.tsx`
- `app/create/page.tsx`
- `app/checkout/success/page.tsx`
- `app/api/auth/signup/route.ts`
- `app/api/generate-poster/route.ts`
- `app/api/stripe/checkout/route.ts`
- `lib/stripe-webhook.ts`
- `.env.example`
- `README.md`
- `tasks/posthog-dashboard-setup.md`

## Etapes a faire sur le nouveau poste (sans restriction)

Depuis la racine du projet:

```bash
npm install
npx tsc --noEmit
npm run build
npx @posthog/wizard@latest doctor --region eu --default
npx @posthog/wizard@latest audit --region eu --default
```

Puis verifier dans PostHog Live Events:
- `$pageview`
- `signup_succeeded` / `signup_failed`
- `login_succeeded` / `login_failed`
- `poster_generation_requested` / `poster_generation_succeeded` / `poster_generation_failed`
- `checkout_started` / `checkout_failed` / `subscription_activated`

## Prompt de reprise (a coller dans la nouvelle session Copilot)

```text
Contexte: reprends la suite PostHog a partir de tasks/handoff-posthog-2026-05-26.md.
Objectif: terminer doctor/audit PostHog wizard sur ce poste, confirmer qu'il n'y a plus de blocage environnement, puis me donner le verdict final avec preuves commande par commande.
Important: ne re-implemente pas PostHog (deja fait), fais uniquement verification finale et actions manquantes.
```
