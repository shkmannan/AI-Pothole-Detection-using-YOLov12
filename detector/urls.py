from django.urls import path

from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path("health/", views.health, name="health"),
    path("api/model/upload/", views.upload_model, name="upload_model"),
    path("api/detect/image/", views.detect_image, name="detect_image"),
    path("api/detect/video/", views.detect_video, name="detect_video"),
    path("api/detect/frame/", views.detect_frame, name="detect_frame"),
    path("api/reports/", views.list_reports, name="list_reports"),
    path("api/reports/create/", views.create_report, name="create_report"),
]
