"""Seed a rich, lifelike demo dataset for local dev and demo deployments.

Idempotent: re-running never creates duplicates (everything keys off stable
natural keys via ``get_or_create``). We use the plain ORM rather than the
factory-boy factories because those live in ``requirements-dev.txt`` only —
importing them here would break ``manage.py`` in production.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.common.choices import DeliverableType, Specialty
from apps.listings.models import Listing
from apps.messaging.models import Conversation, Message
from apps.orders.models import Order
from apps.requests_board.models import Proposal, Request
from apps.reviews.models import Review
from apps.users.models import User

DEMO_PASSWORD = "demo1234"

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

# Two listing ideas per specialty: (title, deliverable_type).
SPECIALTY_LISTINGS = {
    Specialty.CARDIOLOGIE: [
        ("Revue systématique sur les outcomes cardiovasculaires", DeliverableType.VULGARISATION),
        ("Étude de cas — insuffisance cardiaque à FE préservée", DeliverableType.SYNOPSIS_RECHERCHE),
    ],
    Specialty.ONCOLOGIE: [
        ("Article original — immunothérapie en oncologie thoracique", DeliverableType.PROTOCOLE_RECHERCHE),
        ("Résumé pour congrès international d'oncologie", DeliverableType.RESUME_RECHERCHE),
    ],
    Specialty.NEUROLOGIE: [
        ("Revue narrative sur la prise en charge post-AVC", DeliverableType.VULGARISATION),
        ("Article original — biomarqueurs des maladies neurodégénératives", DeliverableType.PROTOCOLE_RECHERCHE),
    ],
    Specialty.PEDIATRIE: [
        ("Étude de cas pédiatrique selon les lignes CARE", DeliverableType.SYNOPSIS_RECHERCHE),
        ("Résumé pour journées de pédiatrie", DeliverableType.RESUME_RECHERCHE),
    ],
    Specialty.DERMATOLOGIE: [
        ("Série de cas en dermatologie inflammatoire", DeliverableType.SYNOPSIS_RECHERCHE),
        ("Revue sur les biothérapies du psoriasis", DeliverableType.VULGARISATION),
    ],
    Specialty.RADIOLOGIE: [
        ("Relecture et reformulation d'un résumé radiologique", DeliverableType.RESUME_RECHERCHE),
        ("Article original — IA et imagerie diagnostique", DeliverableType.PROTOCOLE_RECHERCHE),
    ],
    Specialty.PSYCHIATRIE: [
        ("Revue sur les troubles anxieux et la TCC", DeliverableType.VULGARISATION),
        ("Étude de cas en psychiatrie de liaison", DeliverableType.SYNOPSIS_RECHERCHE),
    ],
    Specialty.NEUROCHIRURGIE: [
        ("Protocole d'étude — chirurgie mini-invasive", DeliverableType.PROTOCOLE_RECHERCHE),
        ("Étude de cas chirurgical rare", DeliverableType.SYNOPSIS_RECHERCHE),
    ],
    Specialty.ENDOCRINOLOGIE: [
        ("Méta-analyse sur le diabète de type 2", DeliverableType.PROTOCOLE_RECHERCHE),
        ("Revue sur les analogues du GLP-1", DeliverableType.VULGARISATION),
    ],
    Specialty.GASTROENTEROLOGIE: [
        ("Revue sur les MICI et les biothérapies", DeliverableType.VULGARISATION),
        ("Étude de cas en hépatologie", DeliverableType.SYNOPSIS_RECHERCHE),
    ],
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


class Command(BaseCommand):
    help = "Seed a rich, lifelike demo dataset. Safe to re-run (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.created = 0
        self.existing = 0

        writers = [self._ensure_writer(*w) for w in WRITERS]
        doctors = [self._ensure_doctor(*d) for d in DOCTORS]

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
        user._specialty = specialty  # carried in-memory for listing seeding
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
        return user

    # -- listings -----------------------------------------------------------
    def _seed_listings(self, writers):
        listings = []
        for writer in writers:
            for title, deliverable in SPECIALTY_LISTINGS[writer._specialty]:
                price, turnaround = PRICING[deliverable]
                listing, created = Listing.objects.get_or_create(
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

            order, created = Order.objects.get_or_create(
                listing=listing, doctor=doctor, defaults=defaults
            )
            self._track(created)

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

    # -- requests + proposals ----------------------------------------------
    def _seed_requests_and_proposals(self, doctors, writers):
        today = date.today()
        for doctor_idx, title, specialty, budget, deadline_days in REQUESTS:
            doctor = doctors[doctor_idx]
            req, created = Request.objects.get_or_create(
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
