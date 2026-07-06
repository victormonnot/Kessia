"""Seed a rich, lifelike demo dataset for local dev and demo deployments.

Idempotent: re-running never creates duplicates (everything keys off stable
natural keys via ``get_or_create``). We use the plain ORM rather than the
factory-boy factories because those live in ``requirements-dev.txt`` only —
importing them here would break ``manage.py`` in production.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from django.core.files import File
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.common.choices import DeliverableType, Specialty
from apps.listings.models import Listing
from apps.messaging.models import Conversation, Message
from apps.orders.models import Order, OrderAttachment, OrderEvent
from apps.orders.services import record_event
from apps.requests_board.models import Proposal, Request
from apps.reviews.models import Review
from apps.users.models import (
    User,
    WriterExperience,
    WriterPortfolioItem,
    WriterPublication,
)

CITIES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Lille", "Nantes", "Strasbourg"]

# Response-time buckets (stored values; labels live in the frontend).
RESPONSE_TIMES = ["few_hours", "one_day", "few_days"]

DEMO_PASSWORD = "demo1234"

# Minimal valid PDF used as a seeded "source document" attached to a few orders,
# so the order workspace's brief section isn't empty in the demo.
_DEMO_BRIEF_PDF = b"%PDF-1.4\n%Cahier des charges (document de demonstration)\n"

# Demo portraits bundled with the backend (gender-matched to each seeded user).
# Source: randomuser.me — demo use only, replaced by real uploads in prod.
SEED_AVATARS_DIR = Path(__file__).resolve().parents[2] / "seed_assets" / "avatars"
# Gender-matched to each profile. Photos 01-04 & 08 = hommes, 05-07 = femmes.
# Clara Fontaine reste sur 05.jpg (ne pas changer).
AVATARS = {
    # Rédactrices (femmes)
    "writer@kessia.demo": "06.jpg",  # Alice Martin
    "sophie.bernard@kessia.demo": "07.jpg",  # Sophie Bernard
    "elena.rossi@kessia.demo": "06.jpg",  # Elena Rossi
    "nadia.benali@kessia.demo": "07.jpg",  # Nadia Benali
    "clara.fontaine@kessia.demo": "05.jpg",  # Clara Fontaine (inchangée)
    # Rédacteurs (hommes)
    "paul.nguyen@kessia.demo": "01.jpg",  # Paul Nguyen
    "karim.haddad@kessia.demo": "02.jpg",  # Karim Haddad
    "thomas.leroy@kessia.demo": "03.jpg",  # Thomas Leroy
    "marc.dubois@kessia.demo": "04.jpg",  # Marc Dubois
    "hugo.moreau@kessia.demo": "08.jpg",  # Hugo Moreau
    # Médecins
    "doctor@kessia.demo": "01.jpg",  # Bob Dupont (H)
    "julie.petit@kessia.demo": "06.jpg",  # Julie Petit (F)
    "antoine.garcia@kessia.demo": "02.jpg",  # Antoine Garcia (H)
    "lea.fournier@kessia.demo": "07.jpg",  # Léa Fournier (F)
    "mehdi.cherif@kessia.demo": "03.jpg",  # Mehdi Chérif (H)
    "camille.roux@kessia.demo": "06.jpg",  # Camille Roux (F)
}

# (email, first, last, specialty, verified, bio)
WRITERS = [
    ("writer@kessia.demo", "Alice", "Martin", Specialty.CARDIOLOGIE, True,
     "Rédactrice médicale freelance, 8 ans d'expérience auprès de laboratoires "
     "et de groupes hospitaliers. Spécialités : cardiologie, oncologie."),
    ("paul.nguyen@kessia.demo", "Paul", "Nguyen", Specialty.ONCOLOGIE, True,
     "Docteur en biologie, rédacteur scientifique spécialisé en oncologie et "
     "immunothérapie. Publications dans des revues à comité de lecture."),
    ("sophie.bernard@kessia.demo", "Sophie", "Bernard", Specialty.NEUROLOGIE, True,
     "Neurologue de formation, j'accompagne les équipes dans la rédaction "
     "d'articles et de revues systématiques."),
    ("karim.haddad@kessia.demo", "Karim", "Haddad", Specialty.PEDIATRIE, False,
     "Rédacteur médical, focus pédiatrie et études de cas cliniques (CARE)."),
    ("elena.rossi@kessia.demo", "Elena", "Rossi", Specialty.DERMATOLOGIE, True,
     "Spécialiste de la rédaction en dermatologie : séries de cas, revues, "
     "résumés de congrès."),
    ("thomas.leroy@kessia.demo", "Thomas", "Leroy", Specialty.RADIOLOGIE, False,
     "Ingénieur biomédical et rédacteur, imagerie et radiologie diagnostique."),
    ("nadia.benali@kessia.demo", "Nadia", "Benali", Specialty.PSYCHIATRIE, True,
     "Rédactrice en santé mentale et psychiatrie, sensible aux enjeux éthiques."),
    ("marc.dubois@kessia.demo", "Marc", "Dubois", Specialty.NEUROCHIRURGIE, False,
     "Ancien interne en chirurgie, rédaction d'articles chirurgicaux et de protocoles."),
    ("clara.fontaine@kessia.demo", "Clara", "Fontaine", Specialty.ENDOCRINOLOGIE, True,
     "Endocrinologie et métabolisme : articles originaux et méta-analyses."),
    ("hugo.moreau@kessia.demo", "Hugo", "Moreau", Specialty.GASTROENTEROLOGIE, False,
     "Rédacteur médical, gastro-entérologie et hépatologie."),
]

# (email, first, last)
DOCTORS = [
    ("doctor@kessia.demo", "Bob", "Dupont"),
    ("julie.petit@kessia.demo", "Julie", "Petit"),
    ("antoine.garcia@kessia.demo", "Antoine", "Garcia"),
    ("lea.fournier@kessia.demo", "Léa", "Fournier"),
    ("mehdi.cherif@kessia.demo", "Mehdi", "Chérif"),
    ("camille.roux@kessia.demo", "Camille", "Roux"),
]

# One listing idea per specialty: (title, deliverable_type).
SPECIALTY_LISTINGS = {
    Specialty.CARDIOLOGIE: ("Revue systématique sur les outcomes cardiovasculaires", DeliverableType.VULGARISATION),
    Specialty.ONCOLOGIE: ("Article original — immunothérapie en oncologie thoracique", DeliverableType.PROTOCOLE_RECHERCHE),
    Specialty.NEUROLOGIE: ("Revue narrative sur la prise en charge post-AVC", DeliverableType.VULGARISATION),
    Specialty.PEDIATRIE: ("Étude de cas pédiatrique selon les lignes CARE", DeliverableType.SYNOPSIS_RECHERCHE),
    Specialty.DERMATOLOGIE: ("Série de cas en dermatologie inflammatoire", DeliverableType.SYNOPSIS_RECHERCHE),
    Specialty.RADIOLOGIE: ("Relecture et reformulation d'un résumé radiologique", DeliverableType.RESUME_RECHERCHE),
    Specialty.PSYCHIATRIE: ("Revue sur les troubles anxieux et la TCC", DeliverableType.VULGARISATION),
    Specialty.NEUROCHIRURGIE: ("Protocole d'étude — chirurgie mini-invasive", DeliverableType.PROTOCOLE_RECHERCHE),
    Specialty.ENDOCRINOLOGIE: ("Méta-analyse sur le diabète de type 2", DeliverableType.PROTOCOLE_RECHERCHE),
    Specialty.GASTROENTEROLOGIE: ("Revue sur les MICI et les biothérapies", DeliverableType.VULGARISATION),
}

# (price, turnaround_days) per deliverable type.
PRICING = {
    DeliverableType.PROTOCOLE_RECHERCHE: (Decimal("900.00"), 21),
    DeliverableType.VULGARISATION: (Decimal("750.00"), 14),
    DeliverableType.SYNOPSIS_RECHERCHE: (Decimal("350.00"), 7),
    DeliverableType.RESUME_RECHERCHE: (Decimal("200.00"), 5),
    DeliverableType.AUTRES: (Decimal("400.00"), 10),
}

REVIEW_COMMENTS = [
    "Travail rigoureux, livré dans les temps. Je recommande vivement.",
    "Excellente plume scientifique, structure et sources impeccables.",
    "Très bonne collaboration, révisions prises en compte rapidement.",
    "Article clair et bien argumenté, parfait pour notre soumission.",
    "Professionnel et réactif. Je referai appel à ses services.",
]
REVIEW_RATINGS = [5, 5, 4, 5, 4, 5, 4, 5, 5, 4]

# (doctor_index, title, specialty, budget, deadline_in_days)
REQUESTS = [
    (1, "Recherche d'un rédacteur pour un article de neurologie", Specialty.NEUROLOGIE, Decimal("1200.00"), 30),
    (2, "Aide pour une série de cas en dermatologie", Specialty.DERMATOLOGIE, Decimal("600.00"), 21),
    (0, "Relecture d'un résumé pour un congrès de radiologie", Specialty.RADIOLOGIE, Decimal("250.00"), 14),
    (3, "Méta-analyse sur le diabète de type 2", Specialty.ENDOCRINOLOGIE, Decimal("1500.00"), 45),
    (4, "Article original en oncologie thoracique", Specialty.ONCOLOGIE, Decimal("1100.00"), 28),
    (5, "Étude de cas en gastro-entérologie", Specialty.GASTROENTEROLOGIE, Decimal("500.00"), 18),
]

ORDER_STATUSES = [
    Order.Status.COMPLETED, Order.Status.COMPLETED, Order.Status.DELIVERED,
    Order.Status.IN_PROGRESS, Order.Status.ACCEPTED, Order.Status.PENDING,
    Order.Status.COMPLETED, Order.Status.COMPLETED, Order.Status.IN_PROGRESS,
    Order.Status.COMPLETED, Order.Status.DELIVERED, Order.Status.ACCEPTED,
    Order.Status.COMPLETED, Order.Status.PENDING, Order.Status.COMPLETED,
]


def _fee(amount: Decimal) -> Decimal:
    return (amount * Decimal("0.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _first_or_create(model, defaults=None, **lookup):
    """Like ``get_or_create`` but tolerant of pre-existing duplicates.

    Seeding runs against a long-lived demo database that may already hold rows
    created through the app (e.g. two orders for the same listing+doctor, where
    the lookup isn't unique). A plain ``get_or_create`` raises
    ``MultipleObjectsReturned`` on those and, under ``start.sh``'s ``set -e``,
    crash-loops the deploy. Returning the first match keeps re-seeding idempotent
    and safe.
    """
    obj = model.objects.filter(**lookup).first()
    if obj is not None:
        return obj, False
    return model.objects.create(**{**lookup, **(defaults or {})}), True


class Command(BaseCommand):
    help = "Seed a rich, lifelike demo dataset. Safe to re-run (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.created = 0
        self.existing = 0

        writers = [self._ensure_writer(*w) for w in WRITERS]
        doctors = [self._ensure_doctor(*d) for d in DOCTORS]
        self._ensure_admin()

        listings = self._seed_listings(writers)
        self._seed_orders_and_reviews(listings, doctors)
        self._seed_requests_and_proposals(doctors, writers)
        self._seed_conversations(doctors, writers)

        self._recap()

    # -- users --------------------------------------------------------------
    def _ensure_writer(self, email, first, last, specialty, verified, bio):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first, "last_name": last, "is_writer": True,
                "is_verified": verified, "is_email_verified": True, "bio": bio,
            },
        )
        self._track(created)
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
        self._assign_avatar(user)
        user._specialty = specialty  # carried in-memory for listing seeding
        self._enrich_writer(user, specialty)
        return user

    def _enrich_writer(self, user, specialty):
        """Fill a lifelike writer profile (headline, expertise, timeline, papers)."""
        label = Specialty(specialty).label
        fields = {}
        if not user.headline:
            fields["headline"] = f"Rédacteur médical · {label}"
        if not user.city:
            fields["city"] = CITIES[len(user.email) % len(CITIES)]
        if not user.expertise_areas:
            fields["expertise_areas"] = [
                "Revue systématique",
                "Article original",
                "Méthodologie & biostatistiques",
            ]
        if user.years_experience is None:
            fields["years_experience"] = 6 + (user.pk % 10)
        if not user.google_scholar_url:
            fields["google_scholar_url"] = "https://scholar.google.com/citations?user=DEMO"
        if not user.languages:
            fields["languages"] = ["Français", "Anglais"]
        if not user.response_time:
            fields["response_time"] = RESPONSE_TIMES[user.pk % len(RESPONSE_TIMES)]
        if fields:
            for key, value in fields.items():
                setattr(user, key, value)
            user.save(update_fields=list(fields))

        if not user.experiences.exists():
            WriterExperience.objects.create(
                user=user, order=0, start_year=2019,
                role="Médecin rédacteur indépendant", organization="Kessia",
                description=f"Rédaction scientifique en {label.lower()} pour revues à comité de lecture.",
            )
            WriterExperience.objects.create(
                user=user, order=1, start_year=2014, end_year=2019,
                role=f"Praticien hospitalier — {label}", organization="CHU",
            )
        if not user.publications.exists():
            WriterPublication.objects.create(
                user=user, order=0, year=2023, is_featured=True,
                title=f"Revue systématique et méta-analyse en {label.lower()}",
                venue="La Revue Médicale", url="https://doi.org/10.0000/demo-1",
            )
            WriterPublication.objects.create(
                user=user, order=1, year=2022,
                title="Étude de cas clinique commentée", venue="Annales médicales",
                url="https://doi.org/10.0000/demo-2",
            )
        if not user.portfolio.exists():
            WriterPortfolioItem.objects.create(
                user=user, order=0, kind="Revue systématique",
                title=f"Méta-analyse en {label.lower()} pour un laboratoire",
                summary="Protocole PRISMA, extraction des données et rédaction complète du manuscrit.",
                url="https://doi.org/10.0000/demo-portfolio-1",
            )
            WriterPortfolioItem.objects.create(
                user=user, order=1, kind="Article original",
                title="Étude observationnelle multicentrique",
                summary="Mise en forme ICMJE et soumission à une revue à comité de lecture.",
                url="https://doi.org/10.0000/demo-portfolio-2",
            )
            WriterPortfolioItem.objects.create(
                user=user, order=2, kind="Cas clinique",
                title=f"Série de cas commentés en {label.lower()}",
                summary="Rédaction au format CARE avec iconographie et discussion.",
            )

    def _ensure_admin(self):
        """A demo owner/admin account (Django staff) for testing the back office.

        Temporary testing convenience — like the other demo accounts, it is meant
        to be removed before a real launch.
        """
        user, created = User.objects.get_or_create(
            email="admin@kessia.demo",
            defaults={
                "first_name": "Admin", "last_name": "Kessia",
                "is_staff": True, "is_superuser": True, "is_email_verified": True,
            },
        )
        self._track(created)
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
        elif not (user.is_staff and user.is_superuser):
            # Keep admin powers on an idempotent re-run.
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["is_staff", "is_superuser"])
        return user

    def _ensure_doctor(self, email, first, last):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first, "last_name": last, "is_writer": False,
                "is_email_verified": True,
            },
        )
        self._track(created)
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
        self._assign_avatar(user)
        return user

    def _assign_avatar(self, user):
        """Attach a bundled demo portrait, (re)writing the file when it's missing.

        On an ephemeral filesystem (e.g. Render's free tier) the media dir is
        wiped on every deploy while the DB keeps the avatar path. Checking the
        path alone would skip the lost file forever, so we re-materialise it
        whenever it's gone — that keeps the seeded portraits displaying with no
        S3. With S3 configured the file persists, so this re-write never fires.
        """
        filename = AVATARS.get(user.email)
        if not filename:
            return
        if user.avatar and user.avatar.storage.exists(user.avatar.name):
            return
        path = SEED_AVATARS_DIR / filename
        if not path.exists():
            return
        with path.open("rb") as fh:
            user.avatar.save(f"{user.pk}_{filename}", File(fh), save=True)

    # -- listings -----------------------------------------------------------
    def _seed_listings(self, writers):
        listings = []
        for writer in writers:
            title, deliverable = SPECIALTY_LISTINGS[writer._specialty]
            price, turnaround = PRICING[deliverable]
            listing, created = _first_or_create(
                Listing,
                writer=writer,
                title=title,
                defaults={
                    "description": (
                        "Rédaction structurée respectant les standards de la "
                        "discipline (PRISMA / CARE / ICMJE selon le format). "
                        "Livraison avec relecture et mise au format de la revue cible."
                    ),
                    "specialty": writer._specialty,
                    "deliverable_type": deliverable,
                    "price": price,
                    "turnaround_days": turnaround,
                    "faq": [
                        {
                            "question": "Que comprend la prestation ?",
                            "answer": (
                                "La rédaction complète du livrable, une relecture et la mise "
                                "au format de la revue ou du support cible."
                            ),
                        },
                        {
                            "question": "Combien de cycles de révision sont inclus ?",
                            "answer": "Deux cycles de révisions sont inclus après la première livraison.",
                        },
                        {
                            "question": "Travaillez-vous à partir de mes données ?",
                            "answer": (
                                "Oui, je pars de vos données et références ; je peux aussi aider "
                                "à structurer la recherche bibliographique."
                            ),
                        },
                    ],
                    "is_published": True,
                },
            )
            self._track(created)
            listings.append(listing)
        return listings

    # -- orders + reviews ---------------------------------------------------
    def _seed_orders_and_reviews(self, listings, doctors):
        review_i = 0
        for i, listing in enumerate(listings[: len(ORDER_STATUSES)]):
            doctor = doctors[i % len(doctors)]
            status = ORDER_STATUSES[i]
            if status == Order.Status.COMPLETED:
                payment = Order.PaymentStatus.RELEASED
            elif status in (Order.Status.IN_PROGRESS, Order.Status.DELIVERED):
                payment = Order.PaymentStatus.HELD
            else:
                payment = Order.PaymentStatus.UNPAID

            defaults = {
                "writer": listing.writer,
                "amount": listing.price,
                "status": status,
                "payment_status": payment,
                "message": "Bonjour, j'aurais besoin de ce travail pour une soumission. Merci !",
            }
            if status == Order.Status.COMPLETED:
                defaults["application_fee_amount"] = _fee(listing.price)
            # Active orders carry a live delivery deadline (from the turnaround).
            if status == Order.Status.IN_PROGRESS:
                defaults["due_at"] = timezone.now() + timedelta(days=listing.turnaround_days)

            order, created = _first_or_create(
                Order, listing=listing, doctor=doctor, defaults=defaults
            )
            self._track(created)

            # Once an order is underway, the doctor has shared a brief document.
            if status in (
                Order.Status.IN_PROGRESS,
                Order.Status.DELIVERED,
                Order.Status.COMPLETED,
            ) and not order.attachments.exists():
                OrderAttachment.objects.create(
                    order=order,
                    uploaded_by=doctor,
                    note="Cahier des charges et références.",
                    file=ContentFile(_DEMO_BRIEF_PDF, name="cahier-des-charges.pdf"),
                )
                self.created += 1

            # Activity-log timeline matching the order's lifecycle stage, so the
            # workspace's "Activité" panel isn't empty in the demo.
            if not order.events.exists():
                self._seed_order_events(order, doctor, status)

            if status == Order.Status.COMPLETED:
                _, r_created = Review.objects.get_or_create(
                    order=order,
                    defaults={
                        "doctor": doctor,
                        "writer": order.writer,
                        "rating": REVIEW_RATINGS[review_i % len(REVIEW_RATINGS)],
                        "comment": REVIEW_COMMENTS[review_i % len(REVIEW_COMMENTS)],
                    },
                )
                self._track(r_created)
                review_i += 1

    def _seed_order_events(self, order, doctor, status):
        S = Order.Status
        record_event(order, OrderEvent.Type.PLACED, actor=doctor)
        if status in (S.ACCEPTED, S.IN_PROGRESS, S.DELIVERED, S.COMPLETED):
            record_event(order, OrderEvent.Type.ACCEPTED, actor=order.writer)
        if status in (S.IN_PROGRESS, S.DELIVERED, S.COMPLETED):
            record_event(order, OrderEvent.Type.PAID, actor=doctor, amount=str(order.amount))
            record_event(
                order,
                OrderEvent.Type.DOCUMENT_ADDED,
                actor=doctor,
                filename="cahier-des-charges.pdf",
            )
        if status in (S.DELIVERED, S.COMPLETED):
            record_event(order, OrderEvent.Type.DELIVERED, actor=order.writer)
        if status == S.COMPLETED:
            record_event(order, OrderEvent.Type.COMPLETED, actor=doctor)
            record_event(
                order,
                OrderEvent.Type.RELEASED,
                amount=str(order.amount - _fee(order.amount)),
            )
        if status == S.DECLINED:
            record_event(order, OrderEvent.Type.DECLINED, actor=order.writer)
        if status == S.CANCELLED:
            record_event(order, OrderEvent.Type.CANCELLED, actor=doctor)
        self.created += order.events.count()

    # -- requests + proposals ----------------------------------------------
    def _seed_requests_and_proposals(self, doctors, writers):
        today = date.today()
        for doctor_idx, title, specialty, budget, deadline_days in REQUESTS:
            doctor = doctors[doctor_idx]
            req, created = _first_or_create(
                Request,
                doctor=doctor,
                title=title,
                defaults={
                    "description": (
                        "Nous recherchons un rédacteur scientifique pour ce projet. "
                        "Données disponibles, accompagnement éditorial souhaité."
                    ),
                    "specialty": specialty,
                    "budget": budget,
                    "deadline": today + timedelta(days=deadline_days),
                    "status": Request.Status.OPEN,
                },
            )
            self._track(created)
            # Two writers propose on each request.
            for offset in (1, 2):
                writer = writers[(doctor_idx + offset) % len(writers)]
                _, p_created = Proposal.objects.get_or_create(
                    request=req,
                    writer=writer,
                    defaults={
                        "price": (budget * Decimal("0.9")).quantize(Decimal("0.01")),
                        "status": Proposal.Status.PENDING,
                        "message": (
                            "Bonjour, ce sujet correspond à mon domaine. Je peux livrer "
                            "une première version sous dix jours."
                        ),
                    },
                )
                self._track(p_created)

    # -- conversations ------------------------------------------------------
    def _seed_conversations(self, doctors, writers):
        pairs = [
            (doctors[0], writers[0], "Bonjour, seriez-vous disponible pour une revue ce mois-ci ?"),
            (doctors[1], writers[1], "Bonjour, quel délai pour un article original en oncologie ?"),
            (doctors[2], writers[4], "Bonjour, j'ai une série de cas à mettre en forme."),
        ]
        for doctor, writer, body in pairs:
            low, high = sorted([doctor, writer], key=lambda u: u.id)
            conv, created = Conversation.objects.get_or_create(
                user_low=low, user_high=high, order=None
            )
            self._track(created)
            if not conv.messages.exists():
                Message.objects.create(conversation=conv, sender=doctor, body=body)
                Message.objects.create(
                    conversation=conv,
                    sender=writer,
                    body="Bonjour, avec plaisir — pouvez-vous m'en dire plus sur le périmètre ?",
                )

    # -- helpers ------------------------------------------------------------
    def _track(self, created):
        if created:
            self.created += 1
        else:
            self.existing += 1

    def _recap(self):
        write = self.stdout.write
        write(self.style.SUCCESS("\nDemo data ready."))
        write("")
        write("Comptes de démonstration (mot de passe : demo1234) :")
        write(f"  Rédactrice principale : {WRITERS[0][0]}")
        write(f"  Médecin principal     : {DOCTORS[0][0]}")
        write(f"  + {len(WRITERS) - 1} autres rédacteurs et {len(DOCTORS) - 1} autres médecins")
        write("")
        write(f"  Objets créés cette fois : {self.created}")
        write(f"  Déjà présents           : {self.existing}")
        write(
            f"  Totaux : {User.objects.count()} users · {Listing.objects.count()} annonces · "
            f"{Order.objects.count()} commandes · {Review.objects.count()} avis · "
            f"{Request.objects.count()} demandes · {Proposal.objects.count()} propositions"
        )
