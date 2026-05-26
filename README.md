# Tifo

Projet SaaS Next.js (App Router) — prototype pour génération d'images/affiches.

## Description

Application Next.js + TypeScript + Tailwind destinée à gérer la génération d'affiches, comptes utilisateurs, facturation basique et tableau d'administration.

## Prérequis

- Node.js 18+ et npm
- Base PostgreSQL (voir `db/*.sql` pour schéma)

## Installation

```bash
npm install
```

Copier les variables d'environnement d'exemple :

```bash
cp .env.example .env.local
# puis éditer .env.local
```

Remplir la base de données en important les fichiers SQL dans `db/`.

## Scripts utiles

```bash
npm run dev        # démarre le serveur de dev (Next.js)
npx tsc --noEmit  # vérifie TypeScript
npm run build      # build de production
npm start          # lance l'app buildée
npm run lint       # lint
```

## Structure importante

- `app/` — pages et routes (App Router)
- `components/` — composants UI
- `api/` — routes API server (serverless handlers)
- `lib/` — logique applicative (db, auth, billing, etc.)
- `db/` — fichiers SQL pour initialisation
- `tasks/` — notes, TODOs, leçons

## Variables d'environnement

Conserver les secrets hors du dépôt. Voir `.env.example` pour la liste minimale attendue.

### Analytics PostHog

Le projet inclut un tracking PostHog côté client et côté serveur.

Variables à renseigner :

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (ex: `https://eu.i.posthog.com`)
- `POSTHOG_API_KEY` (optionnel, fallback sur `NEXT_PUBLIC_POSTHOG_KEY`)
- `POSTHOG_HOST` (optionnel, fallback sur `NEXT_PUBLIC_POSTHOG_HOST`)

Événements principaux déjà instrumentés :

- `signup_succeeded`, `signup_failed`
- `login_succeeded`, `login_failed`
- `poster_generation_requested`, `poster_generation_succeeded`, `poster_generation_failed`, `poster_downloaded`
- `checkout_started`, `checkout_failed`, `checkout_success_page_viewed`, `subscription_activated`

Blueprint dashboards/KPIs prêt à configurer dans PostHog :

- `tasks/posthog-dashboard-setup.md`

## Déploiement

Build puis déployer (ex: Vercel, VPS). Exemple minimal :

```bash
npm run build
npm start
```

## Contribuer

- Ouvrir une issue pour demander des changements.
- Créer une branche feature/bugfix et faire une pull request propre.

## Remarques

- Ce dépôt contient des routes API pour l'authentification, la génération, la facturation et des webhooks ; relire `lib/` avant d'intervenir.
- `.env.local` est ignoré par `.gitignore` (fichier présent en workspace : ajouter vos valeurs locales).

---

Si tu veux, j'ajoute une section "Setup rapide" adaptée à ton OS (Windows) ou un exemple de déploiement Docker.