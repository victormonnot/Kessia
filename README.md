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

## Tests

```bash
docker compose exec backend pytest -q
docker compose exec frontend npm test -- --run
```

## Architecture & limitations

- Stack : Django 5 + DRF + JWT (simplejwt) + PostgreSQL 16 côté backend ; React 18 + Vite + Tailwind + TanStack Query + Zustand côté frontend.
- Limitations MVP assumées (pas de Stripe, pas de chat temps réel, etc.) : voir [`LIMITATIONS.md`](LIMITATIONS.md).
