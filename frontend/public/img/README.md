# Assets images — démo

## `covers/` — photos de couverture (Wikimedia Commons)

Photos sous licences libres (CC BY / CC BY-SA / domaine public) issues de
[Wikimedia Commons](https://commons.wikimedia.org). La provenance exacte de
chaque fichier (titre, licence, lien vers la page de l'œuvre) est dans
[`covers/sources.json`](covers/sources.json) — le tenir à jour à chaque ajout ;
les licences CC BY exigent l'attribution, qu'on assure via ce manifest.

Usage : couverture par défaut des annonces et tuiles de catégories, via
`coverFor(specialty)` (`src/lib/demo-assets.js`). Les fichiers sont nommés
d'après les `value` de `SPECIALTY_OPTIONS` (`cardiologie.jpg`, `neurologie.jpg`…),
les 36 spécialités se rabattent sur ces ~10 familles, et `generique.jpg`
(microscope) sert de repli.

**Démo uniquement** : en production, les rédacteurs uploaderont leurs propres
couvertures (champ backend à venir).

## `avatars/` — portraits démo

12 portraits (`01.jpg`…`12.jpg`) provenant de `randomuser.me/api/portraits`,
attribués de façon déterministe via `avatarFor(name)`. **Usage démo uniquement**
en attendant le champ `User.avatar` côté backend.
