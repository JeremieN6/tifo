# CLAUDE.md -- Memoire Projet

> Ce fichier est lu automatiquement par l'IA au debut de chaque conversation.
> Mets-le a jour a la fin de chaque session de travail.

---

## Objectif Final
<!-- A completer -->

---

## Stack Technique
<!-- A completer -->

---

## Etat Actuel du Projet
**Phase** : Demarrage
**Derniere session** : 2026-05-26
**Progression globale** : 40%

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Integration PostHog client + serveur
- [x] Instrumentation events clefs (signup/login/generation/checkout/subscription)
- [x] Validation TypeScript + build + smoke tests runtime
- [x] Node 22.22.0 installe et utilisable sur le poste
- [x] Shim `unzip` ajoute au PATH pour le wizard PostHog sur Windows

### Prochaines etapes :
- [ ] Verifier les events dans PostHog Live Events
- [ ] Creer les 3 dashboards depuis `tasks/posthog-dashboard-setup.md`

### Statut PostHog
- Le code et la configuration sont en place et coherents avec les variables d'environnement locales.
- `doctor` retourne bien `Found 2 active issues`, mais `audit` reste un TUI interactif qui requiert un vrai terminal pour terminer la derniere etape `Continue`.
- Le blocage `spawnSync unzip ENOENT` est resolu dans le poste courant via `tools/unzip.cmd`.

---

## Blocages et Points d Attention
- Le wizard PostHog ne se termine pas correctement via tâches/pipes car Ink requiert un vrai TTY interactif; la derniere etape doit etre validee dans un terminal humain.
- Eviter toute exposition de secrets hors `.env.local`.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-05-26: PostHog implemente et valide techniquement. Build OK, Node 22.22.0 disponible, shim `unzip` ajoute au PATH, et le wizard arrive bien a l'etape d'audit. Limite restante: la fin du wizard requiert un vrai TTY interactif; les tasks/pipes ne suffisent pas. Voir `tasks/handoff-posthog-2026-05-26.md` pour reprise si verification manuelle souhaitee.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
