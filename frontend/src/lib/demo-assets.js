// Assets démo locaux (public/img) en attendant les champs avatar / couverture
// côté backend. Provenance et licences des photos : public/img/README.md.

// Spécialités avec leur propre photo de couverture (fichier homonyme).
const DIRECT_COVERS = new Set([
  "cardiologie",
  "neurologie",
  "pneumologie",
  "gastroenterologie",
  "ophtalmologie",
  "orl",
  "rhumatologie",
  "psychiatrie",
  "radiologie",
]);

// Spécialités sans photo dédiée → famille visuellement la plus proche.
const COVER_FAMILIES = {
  neurochirurgie: "neurologie",
  hepatologie: "gastroenterologie",
  diabetologie: "gastroenterologie",
  urologie: "gastroenterologie",
  nephrologie: "gastroenterologie",
  allergologie: "pneumologie",
  addictologie: "psychiatrie",
  odontologie: "orl",
};

// Couverture photo d'une annonce ; repli générique : le microscope.
export function coverFor(specialty) {
  if (DIRECT_COVERS.has(specialty)) return `/img/covers/${specialty}.jpg`;
  return `/img/covers/${COVER_FAMILIES[specialty] ?? "generique"}.jpg`;
}

// Portrait démo déterministe : même nom → même visage (01.jpg à 08.jpg).
export function avatarFor(seed) {
  if (!seed) return undefined;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return `/img/avatars/${String((h % 8) + 1).padStart(2, "0")}.jpg`;
}
