from django.urls import path
from .views import *

urlpatterns = [
    path('alert/', emergency_alert, name='emergency_alert'),
    path('dispatch/<int:alert_id>/', responder_dispatch, name='responder_dispatch'),
    path('status/<int:alert_id>/', status_update, name='status_update'),
    path('chat/<int:alert_id>/', emergency_chat, name='emergency_chat'),
    path('api/update-location/', update_location, name='update_location'),
    path('', dashboard, name='dashboard'),
]