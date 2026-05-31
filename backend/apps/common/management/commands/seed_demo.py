"""Seed demo data for local development.

Idempotent: re-running the command never creates duplicates. We use plain
``get_or_create`` instead of the factory-boy factories because (a) the demo
values must be deterministic, and (b) factory-boy lives in
``requirements-dev.txt`` only — importing it from a management command would
break ``manage.py`` in any environment that doesn't install dev deps.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.common.choices import DeliverableType, Specialty
from apps.listings.models import Listing
from apps.orders.models import Order
from apps.requests_board.models import Proposal, Request
from apps.users.models import User

WRITER_EMAIL = "writer@kessia.demo"
DOCTOR_EMAIL = "doctor@kessia.demo"
DEMO_PASSWORD = "demo1234"


class Command(BaseCommand):
    help = "Seed the database with demo data for local development. Safe to re-run."

    @transaction.atomic
    def handle(self, *args, **options):
        created = 0
        existing = 0

        def track(_pair):
            nonlocal created, existing
            obj, was_created = _pair
            if was_created:
                created += 1
            else:
                existing += 1
            return obj

        # --- Users ------------------------------------------------------------
        writer = track(
            self._ensure_user(
                email=WRITER_EMAIL,
                first_name="Alice",
                last_name="Martin",
                is_writer=True,
                bio=(
                    "Rédactrice médicale freelance avec 8 ans d'expérience "
                    "auprès de laboratoires et de groupes hospitaliers. "
                    "Spécialités principales : cardiologie, oncologie, pédiatrie."
                ),
            )
        )
        doctor = track(
            self._ensure_user(
                email=DOCTOR_EMAIL,
                first_name="Bob",
                last_name="Dupont",
                is_writer=False,
                bio="",
            )
        )

        # --- Listings (owned by the writer) ----------------------------------
        listings_spec = [
            {
                "title": "Revue systématique sur les outcomes cardiovasculaires",
                "specialty": Specialty.CARDIOLOGY,
                "deliverable_type": DeliverableType.REVIEW_ARTICLE,
                "price": Decimal("850.00"),
                "turnaround_days": 14,
                "description": (
                    "Revue systématique structurée selon PRISMA, ciblant les "
                    "essais cliniques de phase III publiés sur les cinq "
                    "dernières années. Livraison avec extraction de données, "
                    "méta-analyse exploratoire et discussion critique."
                ),
            },
            {
                "title": "Étude de cas — présentation pédiatrique rare",
                "specialty": Specialty.PEDIATRICS,
                "deliverable_type": DeliverableType.CASE_REPORT,
                "price": Decimal("350.00"),
                "turnaround_days": 7,
                "description": (
                    "Rédaction complète d'une étude de cas pédiatrique "
                    "respectant les lignes directrices CARE. Anonymisation, "
                    "discussion comparative et mise au format de la revue "
                    "cible inclus."
                ),
            },
            {
                "title": "Résumé pour symposium international d'oncologie",
                "specialty": Specialty.ONCOLOGY,
                "deliverable_type": DeliverableType.ABSTRACT,
                "price": Decimal("200.00"),
                "turnaround_days": 5,
                "description": (
                    "Résumé structuré (250 à 300 mots) pour soumission à un "
                    "congrès international d'oncologie. Mise en avant des "
                    "résultats clés et alignement strict sur les consignes "
                    "de l'organisateur."
                ),
            },
        ]
        cardio_listing = None
        for spec in listings_spec:
            listing = track(self._ensure_listing(writer=writer, **spec))
            if listing.specialty == Specialty.CARDIOLOGY:
                cardio_listing = listing

        # --- Requests (posted by the doctor) ---------------------------------
        today = date.today()
        requests_spec = [
            {
                "title": "Recherche d'un rédacteur pour un article de neurologie",
                "specialty": Specialty.NEUROLOGY,
                "budget": Decimal("1200.00"),
                "deadline": today + timedelta(days=30),
                "description": (
                    "Étude observationnelle sur l'évolution de patients "
                    "post-AVC. Recherche d'un rédacteur pour structurer "
                    "l'article complet et retravailler la section discussion."
                ),
            },
            {
                "title": "Aide pour rédiger une série de cas en dermatologie",
                "specialty": Specialty.DERMATOLOGY,
                "budget": Decimal("600.00"),
                "deadline": today + timedelta(days=21),
                "description": (
                    "Série de quatre cas cliniques de dermatologie "
                    "inflammatoire. Données et photos disponibles, à mettre "
                    "en forme selon les guidelines CARE."
                ),
            },
            {
                "title": "Relecture d'un résumé pour un congrès de radiologie",
                "specialty": Specialty.RADIOLOGY,
                "budget": Decimal("250.00"),
                "deadline": today + timedelta(days=14),
                "description": (
                    "Relecture et reformulation d'un résumé radiologique "
                    "de 300 mots pour un congrès européen. Objectif : "
                    "clarté et impact."
                ),
            },
        ]
        neuro_request = None
        for spec in requests_spec:
            req = track(self._ensure_request(doctor=doctor, **spec))
            if req.specialty == Specialty.NEUROLOGY:
                neuro_request = req

        # --- One existing order: doctor -> cardiology listing ----------------
        if cardio_listing is not None:
            track(
                Order.objects.get_or_create(
                    listing=cardio_listing,
                    doctor=doctor,
                    defaults={
                        "writer": cardio_listing.writer,
                        "amount": cardio_listing.price,
                        "status": Order.Status.ACCEPTED,
                        "message": (
                            "Bonjour Alice, j'aurais besoin d'une revue sur "
                            "les outcomes cardiovasculaires d'un nouvel "
                            "anticoagulant. Merci !"
                        ),
                    },
                )
            )

        # --- One existing proposal: writer -> neurology request --------------
        if neuro_request is not None:
            track(
                Proposal.objects.get_or_create(
                    request=neuro_request,
                    writer=writer,
                    defaults={
                        "price": Decimal("1100.00"),
                        "status": Proposal.Status.PENDING,
                        "message": (
                            "Bonjour, je peux livrer l'article structuré "
                            "sous trois semaines, avec une première version "
                            "au bout de dix jours."
                        ),
                    },
                )
            )

        self._print_recap(created, existing)

    # ------------------------------------------------------------------ helpers
    def _ensure_user(self, *, email, first_name, last_name, is_writer, bio):
        user, was_created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "is_writer": is_writer,
                "bio": bio,
            },
        )
        if was_created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
        return user, was_created

    def _ensure_listing(
        self,
        *,
        writer,
        title,
        specialty,
        deliverable_type,
        price,
        turnaround_days,
        description,
    ):
        return Listing.objects.get_or_create(
            writer=writer,
            title=title,
            defaults={
                "description": description,
                "specialty": specialty,
                "deliverable_type": deliverable_type,
                "price": price,
                "turnaround_days": turnaround_days,
                "is_published": True,
            },
        )

    def _ensure_request(
        self,
        *,
        doctor,
        title,
        specialty,
        budget,
        deadline,
        description,
    ):
        return Request.objects.get_or_create(
            doctor=doctor,
            title=title,
            defaults={
                "description": description,
                "specialty": specialty,
                "budget": budget,
                "deadline": deadline,
                "status": Request.Status.OPEN,
            },
        )

    def _print_recap(self, created, existing):
        write = self.stdout.write
        write(self.style.SUCCESS("\nDemo data ready."))
        write("")
        write("Comptes de démonstration :")
        write(f"  Rédactrice : {WRITER_EMAIL}  /  mot de passe : {DEMO_PASSWORD}")
        write(f"  Médecin    : {DOCTOR_EMAIL}  /  mot de passe : {DEMO_PASSWORD}")
        write("")
        write(f"  Créés cette fois        : {created}")
        write(f"  Existaient déjà         : {existing}")
        write(f"  Total objets attendus   : {created + existing}  (2 users + 3 listings + 3 requests + 1 order + 1 proposal = 10)")
