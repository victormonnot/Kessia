// Mode démo (VITE_DEMO_DATA=1) : sert des annonces fixtures sans backend, pour
// héberger la landing seule (Vercel/Pages). Jamais actif sans le flag — en
// local comme en prod, l'API reste la seule source. Données alignées sur
// seed_demo.py : mêmes rédacteurs, mêmes annonces, mêmes photos (public/img).
export const DEMO_MODE = import.meta.env.VITE_DEMO_DATA === "1";

// Une annonce par rédacteur, sur le modèle de ListingListSerializer.
const listing = (
  id,
  writer,
  writerName,
  avatar,
  verified,
  rating,
  reviews,
  title,
  specialty,
  deliverableType,
  price,
  turnaroundDays,
) => ({
  id,
  writer,
  writer_name: writerName,
  writer_avatar: `/img/avatars/${avatar}`,
  writer_is_verified: verified,
  writer_rating: rating,
  writer_reviews_count: reviews,
  is_favorited: false,
  title,
  specialty,
  deliverable_type: deliverableType,
  price,
  turnaround_days: turnaroundDays,
});

const DEMO_LISTINGS = [
  listing(101, 1, "Clara Fontaine", "05.jpg", true, 5.0, 9,
    "Méta-analyse sur le diabète de type 2", "endocrinologie", "protocole_recherche", "900.00", 21),
  listing(102, 2, "Alice Martin", "06.jpg", true, 4.9, 8,
    "Revue systématique sur les outcomes cardiovasculaires", "cardiologie", "vulgarisation", "750.00", 14),
  listing(103, 3, "Paul Nguyen", "01.jpg", true, 4.8, 6,
    "Article original — immunothérapie en oncologie thoracique", "oncologie", "protocole_recherche", "900.00", 21),
  listing(104, 4, "Sophie Bernard", "07.jpg", true, 4.7, 5,
    "Revue narrative sur la prise en charge post-AVC", "neurologie", "vulgarisation", "750.00", 14),
  listing(105, 5, "Karim Haddad", "02.jpg", false, 4.6, 3,
    "Étude de cas pédiatrique selon les lignes CARE", "pediatrie", "synopsis_recherche", "350.00", 7),
  listing(106, 6, "Elena Rossi", "06.jpg", true, 4.5, 4,
    "Série de cas en dermatologie inflammatoire", "dermatologie", "synopsis_recherche", "350.00", 7),
  listing(107, 7, "Nadia Benali", "07.jpg", true, 4.5, 7,
    "Revue sur les troubles anxieux et la TCC", "psychiatrie", "vulgarisation", "750.00", 14),
  listing(108, 8, "Thomas Leroy", "03.jpg", false, 0, 0,
    "Relecture et reformulation d'un résumé radiologique", "radiologie", "resume_recherche", "200.00", 5),
];

// Reproduit les filtres du endpoint listings utilisés par le front.
export function demoListingsResponse(params = {}) {
  let results = [...DEMO_LISTINGS];
  if (params.specialty) {
    results = results.filter((l) => l.specialty === params.specialty);
  }
  if (params.deliverable_type) {
    results = results.filter((l) => l.deliverable_type === params.deliverable_type);
  }
  if (params.search) {
    const q = String(params.search).toLowerCase();
    results = results.filter((l) =>
      `${l.title} ${l.writer_name}`.toLowerCase().includes(q),
    );
  }
  if (params.ordering === "-writer_rating") {
    results.sort((a, b) => b.writer_rating - a.writer_rating);
  } else if (params.ordering === "price") {
    results.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (params.ordering === "-price") {
    results.sort((a, b) => Number(b.price) - Number(a.price));
  }
  return { count: results.length, results };
}
