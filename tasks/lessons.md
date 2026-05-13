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
