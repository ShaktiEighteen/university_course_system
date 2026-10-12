from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('', include('apps.core.urls')),
    path('', include('apps.courses.urls')),
    path('', include('apps.registration.urls')),
]
