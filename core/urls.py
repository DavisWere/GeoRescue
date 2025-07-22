from django.urls import path
from . import views

urlpatterns = [
    path('alert/', views.emergency_alert, name='emergency_alert'),
    path('dispatch/<int:alert_id>/', views.responder_dispatch, name='responder_dispatch'),
    path('chat/<int:alert_id>/', views.emergency_chat, name='emergency_chat'),
    path('status/<int:alert_id>/', views.status_update, name='status_update'),
    path('api/update-location/', views.update_location, name='update_location'),
]