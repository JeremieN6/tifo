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
**Progression globale** : 35%

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Integration PostHog client + serveur
- [x] Instrumentation events clefs (signup/login/generation/checkout/subscription)
- [x] Validation TypeScript + build + smoke tests runtime

### Prochaines etapes :
- [ ] Finaliser `npx @posthog/wizard@latest doctor/audit` sur un poste non restreint
- [ ] Verifier les events dans PostHog Live Events
- [ ] Creer les 3 dashboards depuis `tasks/posthog-dashboard-setup.md`

---

## Blocages et Points d Attention
- Le poste de travail actuel bloque le wizard PostHog (`spawnSync unzip ENOENT`) a cause des restrictions environnement/proxy.
- Eviter toute exposition de secrets hors `.env.local`.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-05-26: PostHog implemente et valide techniquement. Build OK et event reel envoye. Le seul blocage restant est l'execution du wizard doctor/audit sur ce poste (restriction environnement). Voir `tasks/handoff-posthog-2026-05-26.md` pour reprise sur autre machine.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
