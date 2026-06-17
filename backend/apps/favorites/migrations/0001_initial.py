import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("listings", "0004_alter_listing_deliverable_type"),
        ("requests_board", "0003_alter_request_specialty"),
    ]

    operations = [
        migrations.CreateModel(
            name="Favorite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "listing",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorited_by",
                        to="listings.listing",
                    ),
                ),
                (
                    "request",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorited_by",
                        to="requests_board.request",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddConstraint(
            model_name="favorite",
            constraint=models.UniqueConstraint(
                condition=models.Q(("listing__isnull", False)),
                fields=("user", "listing"),
                name="uniq_favorite_user_listing",
            ),
        ),
        migrations.AddConstraint(
            model_name="favorite",
            constraint=models.UniqueConstraint(
                condition=models.Q(("request__isnull", False)),
                fields=("user", "request"),
                name="uniq_favorite_user_request",
            ),
        ),
        migrations.AddConstraint(
            model_name="favorite",
            constraint=models.CheckConstraint(
                check=models.Q(
                    ("listing__isnull", False), ("request__isnull", True), _connector="AND"
                )
                | models.Q(
                    ("listing__isnull", True), ("request__isnull", False), _connector="AND"
                ),
                name="favorite_exactly_one_target",
            ),
        ),
    ]
