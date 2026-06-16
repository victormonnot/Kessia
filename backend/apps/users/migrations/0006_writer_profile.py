import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_user_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="headline",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name="user",
            name="city",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="google_scholar_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="years_experience",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="expertise_areas",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="profile_sections",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="WriterExperience",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(max_length=160)),
                ("organization", models.CharField(blank=True, max_length=160)),
                ("start_year", models.PositiveIntegerField(blank=True, null=True)),
                ("end_year", models.PositiveIntegerField(blank=True, null=True)),
                ("description", models.TextField(blank=True)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="experiences",
                        to="users.user",
                    ),
                ),
            ],
            options={"ordering": ("order", "-start_year")},
        ),
        migrations.CreateModel(
            name="WriterPublication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=300)),
                ("url", models.URLField(blank=True)),
                ("venue", models.CharField(blank=True, max_length=200)),
                ("year", models.PositiveIntegerField(blank=True, null=True)),
                ("is_featured", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="publications",
                        to="users.user",
                    ),
                ),
            ],
            options={"ordering": ("order", "-is_featured", "-year")},
        ),
    ]
