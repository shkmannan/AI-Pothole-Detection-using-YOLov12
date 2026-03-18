from django.urls import path

from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path("health/", views.health, name="health"),
    path("api/detect/image/", views.detect_image, name="detect_image"),
    path("api/detect/video/", views.detect_video, name="detect_video"),
    path("api/detect/frame/", views.detect_frame, name="detect_frame"),
]
