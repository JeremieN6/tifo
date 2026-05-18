# Lessons Learned

> Ce fichier est mis a jour apres CHAQUE correction faite par l utilisateur.
> But : ne plus refaire les memes erreurs. Relu au debut de chaque session.

---

## Format

### [DATE] Titre du probleme
**Probleme** : Description de ce qui a mal tourne.
**Cause racine** : Pourquoi c est arrive.
**Solution** : Ce qui a ete fait pour corriger.
**Regle** : La regle a suivre desormais pour eviter ce cas.

---

## Lecons

### [2026-05-13] Validation UI vs API non alignee
**Probleme** : Les champs equipe etaient rendus plus flexibles en UI, mais l API continuait d exiger 2 equipes dans tous les cas.
**Cause racine** : La regle metier n etait pas centralisee et n a ete modifiee que cote front.
**Solution** : Aligner la validation front + backend selon le type d evenement (annonce non transfert = equipe B optionnelle).
**Regle** : Toute modification des champs obligatoires dans un formulaire doit etre reproduite dans la validation API associee dans la meme tache.

### [2026-05-13] Recherche de clubs basee sur une source non fiable
**Probleme** : La recherche de clubs renvoyait des resultats absurdes comme Arsenal pour Troyes, Pau ou Lille, et l etape logos restait vide si l utilisateur ne cliquait pas explicitement une suggestion.
**Cause racine** : TheSportsDB n etait pas fiable pour cette recherche libre, et le front ne propageait le logo que lors d un clic sur une suggestion au lieu de le faire apres resolution du meilleur resultat.
**Solution** : Remplacer le provider par une recherche clubs-only via Wikidata, scorer les resultats sur le nom reel du club, puis auto-remplir le logo avec le premier resultat retourne.
**Regle** : Pour tout autocomplete metier, verifier d abord la qualite reelle des donnees source sur des cas negatifs concrets, et ne jamais lier un champ derive uniquement a un clic utilisateur si une resolution automatique est attendue.

### [2026-05-13] Ne jamais fallback d un logo vers une photo generique
**Probleme** : Certains clubs affichaient une photo de stade a la place du logo.
**Cause racine** : Le backend utilisait `P18` comme fallback quand la propriete logo `P154` etait absente dans Wikidata.
**Solution** : Supprimer le fallback `P18` et ne retourner un visuel que s il s agit d un vrai logo.
**Regle** : Pour un champ logo/blason, n utiliser que des proprietes explicitement typées logo ou blason. Une absence de logo est preferable a une mauvaise image.

### [2026-05-13] Un provider tiers ne doit jamais etre accepte sur son premier resultat brut
**Probleme** : TheSportsDB renvoyait Arsenal quel que soit le club demande, ce qui polluait les logos.
**Cause racine** : Le provider etait interroge sans verifier strictement que le club retourne correspondait bien au club selectionne via Wikidata.
**Solution** : Introduire un matching strict sur le nom canonique et ses alias avant d accepter un logo tiers, puis tomber sur le provider suivant ou sur un placeholder.
**Regle** : Tout fallback de donnees tiers doit etre valide contre l identite canonique de l entite source avant d etre affiche a l utilisateur.

### [2026-05-18] Verifier explicitement les exigences deja annoncees comme faites
**Probleme** : Une demande initiale (quota Starter + formats verrouilles + pricing + FAQ) n etait pas integralement appliquee alors que la session avait continue sur un autre sujet.
**Cause racine** : Absence de verification finale requirement-by-requirement apres les premiers changements.
**Solution** : Relecture systematique des fichiers cibles, patch des ecarts restants et validation TypeScript avant confirmation.
**Regle** : Ne jamais confirmer une demande multi-points sans check-list complete de chaque exigence dans le code.
