# STORY.md -- Memoire Narrative Projet

> Ce fichier raconte le projet pour un public exterieur (article de blog, retro, pitch).
> Il ne contient pas de detail d'implementation technique -- voir CLAUDE.md pour ca.

---

## Objectif produit
Tifo permet a un club, un supporter ou un media sportif de generer en quelques clics une affiche visuelle professionnelle pour annoncer un transfert, un mercato ou un evenement football, sans passer par un graphiste.

---

## Statut actuel
Le produit est fonctionnel de bout en bout : inscription, generation d'affiches avec logos de clubs auto-remplis, abonnement payant (Stripe), back-office admin pour gerer les comptes et les essais gratuits, et un blog automatise pour l'acquisition SEO. Le projet est en phase de lancement : la mise en production reelle, VPS, paiement, verification email est ok. Les premiers clubs ont été contacté sur Insta, le marketing a donc commencé via cold DM Insta. Quelques inscriptions ont déjà été enregistrés.

---

## Historique des pivots

### [2026-05-13] Fiabiliser l'identification visuelle des clubs
**Contexte** : les premieres versions de la recherche de club renvoyaient des logos et resultats absurdes (un club francais amateur pouvait se voir attribuer le logo d'Arsenal), rendant le produit peu credible des la premiere utilisation.
**Decision** : abandonner le fournisseur de donnees initial pour une source plus fiable (Wikidata), avec verification stricte de la correspondance de nom avant d'accepter un logo, et refus explicite d'afficher une image generique (comme une photo de stade) quand le vrai logo est introuvable.
**Resultat** : la fonctionnalite coeur du produit (habiller une affiche avec le bon logo) devient fiable, ce qui conditionnait directement la qualite percue du produit.

### [2026-05-26] Segmenter l'offre d'essai plutot que l'ouvrir a tous
**Contexte** : une offre commerciale de 90 jours d'essai gratuit sur le plan "Club" avait ete pensee pour cibler des clubs specifiques, mais l'implementation initiale l'activait automatiquement pour tout nouvel inscrit.
**Decision** : revenir a une inscription standard sur le plan de base, et reserver l'attribution de l'offre premium a une action manuelle du backoffice.
**Resultat** : evite de diluer une offre commerciale ciblee et de fausser les metriques d'acquisition/conversion des le lancement.

### [2026-05-26 -> 2026-08-27] Construire les fondations produit avant le lancement public
**Contexte** : entre fin mai et mi-aout, le projet est passe d'un prototype avec authentification et generation basique a un produit avec facturation complete, gestion des essais, back-office admin et acquisition SEO (blog automatise).
**Decision** : prioriser la solidite operationnelle (facturation, gestion des utilisateurs, contenu SEO recurrent) avant l'ouverture publique, plutot que d'ajouter de nouvelles fonctionnalites de generation.
**Resultat** : le produit dispose maintenant des briques necessaires a une exploitation reelle (facturation, support client via l'admin, acquisition organique), mais n'a pas encore ete teste en conditions reelles de paiement ni deploye en production.

---

## Ce que la cible attend / a appris
- Un supporter ou un club veut un visuel credible immediatement reconnaissable (bon logo, bonne mise en page) : la fiabilite du logo s'est averee etre un prerequis de confiance, pas un detail cosmetique.
- Une offre commerciale segmentee (essai gratuit cible) doit rester pilotee manuellement tant que le produit n'a pas de mecanisme d'eligibilite automatique fiable.

---

## Garde-fous de contenu
- Ne jamais publier de detail technique exploitable (architecture interne, cles/API, mecanique anti-abus) dans un article externe base sur ce fichier.
- Ne jamais citer de chiffre business precis (taux de conversion, revenu, nombre d'utilisateurs) sans indiquer sa source ou le marquer explicitement "a verifier" -- aucun chiffre de ce type n'est encore verifie a la date de derniere mise a jour.
- Ne pas adopter un ton condescendant envers les clubs ou supporters cibles ; parler de leurs besoins reels (credibilite visuelle, simplicite) plutot que de mecaniques internes.
- Ce projet n'est pas encore lance publiquement : ne pas presenter de metriques d'usage ou de temoignages clients comme s'ils existaient.

---

## Derniere mise a jour
2026-08-27 -- Creation initiale du fichier, reconstitue a partir de l'historique git (commits du 2026-05-13 au 2026-07-16), de CLAUDE.md et de tasks/todo.md.
