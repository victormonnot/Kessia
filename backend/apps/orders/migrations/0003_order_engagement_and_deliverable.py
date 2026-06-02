import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.orders.models


def backfill_writer_and_amount(apps, schema_editor):
    """Existing orders all come from a listing; snapshot its writer and price."""
    Order = apps.get_model("orders", "Order")
    for order in Order.objects.select_related("listing").all():
        if order.listing_id:
            order.writer_id = order.listing.writer_id
            order.amount = order.listing.price
            order.save(update_fields=["writer", "amount"])


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_initial"),
        ("requests_board", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # --- Status machine: add the new states -----------------------------
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("accepted", "Accepted"),
                    ("declined", "Declined"),
                    ("in_progress", "In progress"),
                    ("delivered", "Delivered"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=16,
            ),
        ),
        # --- Unify origin: listing becomes optional, add proposal -----------
        migrations.AlterField(
            model_name="order",
            name="listing",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="orders",
                to="listings.listing",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="proposal",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="orders",
                to="requests_board.proposal",
            ),
        ),
        # --- Snapshot fields (added nullable, backfilled, then made required) -
        migrations.AddField(
            model_name="order",
            name="writer",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="orders_received",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="amount",
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="currency",
            field=models.CharField(default="EUR", max_length=3),
        ),
        # --- Stripe payment state -------------------------------------------
        migrations.AddField(
            model_name="order",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("unpaid", "Unpaid"),
                    ("processing", "Processing"),
                    ("held", "Held"),
                    ("released", "Released"),
                    ("refunded", "Refunded"),
                    ("failed", "Failed"),
                ],
                default="unpaid",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="stripe_payment_intent_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="order",
            name="stripe_charge_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="order",
            name="stripe_transfer_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="order",
            name="application_fee_amount",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        # --- Deliverable model ----------------------------------------------
        migrations.CreateModel(
            name="Deliverable",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "file",
                    models.FileField(
                        upload_to=apps.orders.models.deliverable_upload_path
                    ),
                ),
                ("note", models.TextField(blank=True)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="deliverables",
                        to="orders.order",
                    ),
                ),
            ],
            options={
                "ordering": ("-uploaded_at",),
            },
        ),
        # --- Backfill then enforce NOT NULL on the snapshot fields ----------
        migrations.RunPython(
            backfill_writer_and_amount,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="order",
            name="writer",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="orders_received",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="amount",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
    ]
