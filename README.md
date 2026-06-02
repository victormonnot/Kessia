# Kessia

Marketplace de rédaction médicale qui met en relation médecins / institutions et rédacteurs scientifiques freelance. Projet capstone Holberton 2026 (Victor Monnot, Yasi Philippe Hübner, Soumia Taoui).

Documentation projet : voir [`High-LevelPlan.md`](High-LevelPlan.md) (planning, équipe, jalons) et le dossier [`Meetings/`](Meetings/).

## Getting Started

Prérequis : Docker + Docker Compose.

```bash
git clone <repo>
cd Kessia
cp .env.example .env
docker compose up --build
```

Puis charger les données de démo pour ne pas avoir une UI vide :

```bash
docker compose exec backend python manage.py seed_demo
```

La commande est idempotente — vous pouvez la relancer sans créer de doublons.

Elle crée :

- un compte rédacteur : `writer@kessia.demo` / `demo1234`
- un compte médecin : `doctor@kessia.demo` / `demo1234`
- 3 annonces, 3 demandes, 1 commande déjà acceptée, 1 proposition en attente

Adresses :

- Frontend : <http://localhost:5173/>
- API Swagger : <http://localhost:8000/api/docs/>
- Admin Django : <http://localhost:8000/admin/> (créer un superuser avec `docker compose exec backend python manage.py createsuperuser`)

### Paiements (Stripe, mode test)

Le flux de paiement exige des **clés de test Stripe**. Renseignez dans `.env` :

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Parcours : le médecin commande → le rédacteur accepte → le médecin paie (carte de
test `4242 4242 4242 4242`, date future, CVC quelconque) → les fonds sont
séquestrés → à la finalisation, le versement (montant − 15 % de commission) part
vers le compte Stripe Connect du rédacteur ; une annulation après paiement
rembourse automatiquement. Les webhooks font foi en prod ; en dev un endpoint de
synchronisation permet au flux d'aboutir sans la CLI Stripe (sinon :
`stripe listen --forward-to localhost:8000/api/v1/payments/webhook/`).

### Messagerie temps réel

Le backend tourne en **ASGI (Daphne)** ; la messagerie utilise Django Channels
(couche in-memory en dev, Redis en prod). Aucun réglage n'est requis en local.

## Tests

```bash
docker compose exec backend pytest -q
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run lint
```

## Architecture

- **Backend** : Django 5 + DRF, JWT (refresh token en cookie httpOnly + CSRF),
  PostgreSQL 16, Stripe Connect (paiements en séquestre), Django Channels +
  Daphne (WebSockets), e-mails transactionnels, stockage S3 en prod
  (django-storages). Apps : `users`, `listings`, `orders`, `requests_board`,
  `payments`, `reviews`, `messaging`, `verification`.
- **Frontend** : React 18 + Vite + Tailwind, TanStack Query, Zustand, Axios
  (refresh silencieux sur 401). UI 100 % française.
- **Déploiement** (Railway/Render) : voir [`DEPLOYMENT.md`](DEPLOYMENT.md).
- **Limitations connues** : voir [`LIMITATIONS.md`](LIMITATIONS.md).
