import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0006_writer_profile"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="languages",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="response_time",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.CreateModel(
            name="WriterPortfolioItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("kind", models.CharField(blank=True, max_length=120)),
                ("url", models.URLField(blank=True)),
                ("summary", models.TextField(blank=True)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="portfolio",
                        to="users.user",
                    ),
                ),
            ],
            options={"ordering": ("order", "id")},
        ),
    ]
