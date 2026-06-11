// Assets démo locaux (public/img) en attendant les champs avatar / couverture
// côté backend. Provenance et licences des gravures : public/img/README.md.

// Spécialités avec leur propre planche gravée (fichier homonyme).
const DIRECT_PLATES = new Set([
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

// Spécialités sans planche dédiée → famille visuellement la plus proche.
const PLATE_FAMILIES = {
  neurochirurgie: "neurologie",
  hepatologie: "gastroenterologie",
  diabetologie: "gastroenterologie", // le pancréas est sur la planche
  urologie: "gastroenterologie",
  nephrologie: "gastroenterologie",
  endocrinologie: "pneumologie", // la planche montre aussi la thyroïde
  allergologie: "pneumologie",
  addictologie: "psychiatrie",
  odontologie: "orl", // planche des os du crâne
  pharmacologie: "botanique", // la digitale, plante médicinale
};

// Couverture gravée d'une annonce ; repli générique : la digitale pourprée.
export function engravingFor(specialty) {
  if (DIRECT_PLATES.has(specialty)) return `/img/engravings/${specialty}.jpg`;
  return `/img/engravings/${PLATE_FAMILIES[specialty] ?? "botanique"}.jpg`;
}

// Portrait démo déterministe : même nom → même visage (01.jpg à 12.jpg).
export function avatarFor(seed) {
  if (!seed) return undefined;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return `/img/avatars/${String((h % 12) + 1).padStart(2, "0")}.jpg`;
}
