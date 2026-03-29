from django.contrib import admin

from .models import PotholeReport


@admin.register(PotholeReport)
class PotholeReportAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "source",
        "detections_count",
        "avg_confidence",
        "latitude",
        "longitude",
        "accuracy_m",
    )
    list_filter = ("source", "created_at")
    search_fields = ("source",)
