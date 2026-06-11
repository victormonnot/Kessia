# Assets images — identité « La Revue »

## `engravings/` — gravures scientifiques (domaine public)

Planches anatomiques et botaniques issues de la [Wellcome Collection](https://wellcomecollection.org),
toutes sous **Public Domain Mark** (réutilisation libre, y compris commerciale).
La provenance exacte de chaque fichier (titre, lien vers l'œuvre) est dans
[`engravings/sources.json`](engravings/sources.json) — le tenir à jour à chaque ajout.

Usage prévu :

- `hero-coeur.jpg` : héro de la landing.
- `<specialite>.jpg` : couverture par défaut des annonces ; les fichiers sont
  nommés d'après les `value` de `SPECIALTY_OPTIONS` (`cardiologie.jpg`,
  `neurologie.jpg`…). Les 36 spécialités se rabattent sur ~10 familles
  (ex. `neurochirurgie` → `neurologie`, `hepatologie` → `gastroenterologie`),
  et `botanique.jpg` (digitale pourprée) sert de repli générique.

**Rendu** : afficher sur fond papier avec la classe `img-engraving`
(`src/styles/index.css`) — grayscale + teinte sapin + `mix-blend-mode: multiply`
pour fondre le fond du scan dans le papier. Les originaux restent intacts.

## `avatars/` — portraits démo

12 portraits (`01.jpg`…`12.jpg`) provenant de `randomuser.me/api/portraits`.
**Usage démo uniquement** (seed/placeholder en attendant le champ
`User.avatar` côté backend) — à remplacer par les vraies photos des
utilisateurs en production.
