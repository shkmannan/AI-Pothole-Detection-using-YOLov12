from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("detector", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="potholereport",
            name="depth_cm",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="potholereport",
            name="distance_m",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="potholereport",
            name="severity",
            field=models.CharField(
                choices=[
                    ("unknown", "Unknown"),
                    ("low", "Low"),
                    ("medium", "Medium"),
                    ("high", "High"),
                ],
                default="unknown",
                max_length=16,
            ),
        ),
    ]
