# STORY.md -- Memoire Narrative Projet

> Ce fichier raconte le projet pour un public exterieur (article de blog, retro, pitch).
> Il ne contient pas de detail d'implementation technique -- voir CLAUDE.md pour ca.

---

## Objectif produit
Tifo permet a un club, un supporter ou un media sportif de generer en quelques clics une affiche visuelle professionnelle pour annoncer un transfert, un mercato ou un evenement football, sans passer par un graphiste.

---

## Statut actuel
Le produit est fonctionnel de bout en bout : inscription, generation d'affiches avec logos de clubs auto-remplis, abonnement payant (Stripe), back-office admin pour gerer les comptes et les essais gratuits, et un blog automatise pour l'acquisition SEO. Le projet est lance en production (VPS, paiement, verification email operationnels) et a converti son premier client payant le 2026-09-30 (voir Historique des pivots).

Le demarchage actif se fait par cold DM Instagram aupres de clubs amateurs. A date, ce canal a produit des inscriptions mais pas (encore) le premier paiement -- celui-ci est venu d'un canal non sollicite (voir ci-dessous). Les deux canaux restent suivis separement pour ne pas fausser l'attribution.

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

### [2026-09-30] Premier client payant, toutes activites SaaS confondues
**Contexte** : apres plusieurs mois a construire differents produits, aucun n'avait encore converti de visiteur en client payant reel.
**Decision** : rien a decider ici -- c'est un jalon qui s'est produit, pas un choix.
**Resultat** : Tifo devient le premier produit a convertir un abonnement payant (plan Pro, 9 euros/mois, verifie cote Stripe : abonnement actif, paiement par carte recurrent). Marque la fin d'une phase de construction pure et le debut d'une phase avec au moins un revenu reel valide -- et ce n'etait pas le produit sur lequel le plus d'efforts recents avaient ete concentres.

### [2026-09-30] Le premier client est venu d'un canal non sollicite, pas de l'outreach actif
**Contexte** : le demarchage actif du moment se faisait par cold DM Instagram aupres de clubs amateurs. L'hypothese naturelle etait que le premier client en soit issu.
**Decision** : verifier l'attribution reelle avant de l'ecrire en dur dans la documentation, plutot que de supposer. Les donnees d'analytics montrent : inscription sans referrer HTTP classique, avec un parametre `utm_source=chatgpt.com`, depuis une app mobile iOS -- une signature technique incompatible avec un DM Instagram (qui amenerait un referrer Instagram) ou une visite web classique.
**Resultat** : le client n'a pas ete demarche -- il est arrive via un lien partage ou recommande au sein d'une conversation ChatGPT (probablement l'app mobile). Canal non anticipe, a ne pas generaliser a partir d'un seul cas, mais qui ouvre une piste a surveiller : la visibilite dans les reponses des assistants IA (parfois appelee GEO, Generative Engine Optimization) plutot que le seul referencement Google classique. 
**Ouverture** : Le GEO devrait peut etre devenir le canal d'acquisition sur lequel il faut se focaliser... Surtout lorsqu'on connait le nombre de personnes utilisant les LLM au quotidien.

### [2026-09-30] Incident technique pendant la toute premiere session du client, corrige et client recontacte
**Contexte** : lors de sa toute premiere session (19h04-19h18), le client a subi 17 echecs de generation sur un total de 19 tentatives (avant et apres son passage au plan payant), tous avec une erreur reseau cote navigateur.
**Decision** : diagnostiquer avant de corriger au hasard. Cause identifiee en deux temps sur le serveur VPS : d'abord un timeout nginx par defaut (60s, insuffisant pour une generation avec images de reference), puis -- apres un premier test en conditions reelles toujours en echec -- une limite de taille de requete nginx par defaut (1 Mo, trop basse pour un formulaire avec plusieurs images). Les deux corrigees le jour meme. Le client a ensuite ete prevenu par email que l'incident etait resolu, sans entrer dans le detail technique.
**Resultat** : malgre un premier contact technique rate (le client a paye alors que la quasi-totalite de ses tentatives echouaient), il est revenu consulter son compte le lendemain matin -- signal de confiance preserve malgre le faux depart. Lecon retenue : un visiteur aussi determine que celui-ci est rare ; la plupart des prospects moins motives abandonnent probablement au meme point d'echec, sans jamais remonter dans les metriques.

---

## Ce que la cible attend / a appris
- Un supporter ou un club veut un visuel credible immediatement reconnaissable (bon logo, bonne mise en page) : la fiabilite du logo s'est averee etre un prerequis de confiance, pas un detail cosmetique.
- Une offre commerciale segmentee (essai gratuit cible) doit rester pilotee manuellement tant que le produit n'a pas de mecanisme d'eligibilite automatique fiable.
- Le canal d'acquisition le plus efficace n'est pas toujours celui sur lequel on investit le plus activement : verifier l'attribution reelle (analytics) avant d'ecrire une histoire d'acquisition, plutot que de supposer qu'elle vient de l'effort le plus visible.
- Un visiteur suffisamment convaincu peut payer malgre un produit qui echoue presque systematiquement devant lui -- ce n'est pas une preuve que l'experience est bonne, c'est un signal qu'il ne faut pas perdre les prospects moins determines qui, eux, abandonnent silencieusement au meme endroit.

---

## Garde-fous de contenu
- Ne jamais publier de detail technique exploitable (architecture interne, cles/API, mecanique anti-abus) dans un article externe base sur ce fichier.
- Ne jamais citer de chiffre business precis (taux de conversion, revenu, nombre d'utilisateurs) sans indiquer sa source ou le marquer explicitement "a verifier" -- aucun chiffre de ce type n'est encore verifie a la date de derniere mise a jour.
- Ne pas adopter un ton condescendant envers les clubs ou supporters cibles ; parler de leurs besoins reels (credibilite visuelle, simplicite) plutot que de mecaniques internes.
- Le projet a desormais un premier client payant reel (2026-09-30) : on peut le mentionner comme fait, mais ne jamais en extrapoler des statistiques (taux de conversion, retention, LTV) a partir d'un seul point de donnees -- un cas n'est pas une tendance.
- Ne jamais nommer, identifier ou decrire un client de maniere a le rendre reconnaissable (email, localisation precise, details de son club) dans un contenu externe -- seuls les faits agreges ou anonymises sortent de ce document.

---

## Derniere mise a jour
2026-10-01 -- Ajout du premier client payant (2026-09-30), correction de l'attribution d'acquisition (canal ChatGPT/lien partage, pas l'outreach Instagram -- verifie via PostHog : utm_source=chatgpt.com, aucun referrer HTTP classique, app mobile iOS) et de l'incident technique nginx de sa premiere session (timeout + limite de taille de requete, corriges le jour meme, client recontacte par email). Dates harmonisees sur le 2026-09-30, date reelle de l'abonnement Stripe (verifiee via l'API Stripe), la reconnexion du 2026-10-01 au matin n'etant qu'une consultation breve du compte.
