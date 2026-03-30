from django.db import models


class PotholeReport(models.Model):
    SEVERITY_CHOICES = [
        ("unknown", "Unknown"),
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    source = models.CharField(max_length=32)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    detections_count = models.PositiveIntegerField()
    avg_confidence = models.FloatField(default=0.0)
    accuracy_m = models.FloatField(null=True, blank=True)
    distance_m = models.FloatField(null=True, blank=True)
    depth_cm = models.FloatField(null=True, blank=True)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, default="unknown")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return (
            f"{self.source} | {self.severity} | {self.detections_count} pothole(s) "
            f"at {self.latitude}, {self.longitude}"
        )
