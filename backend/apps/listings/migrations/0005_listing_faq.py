from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0004_alter_listing_deliverable_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="faq",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
