from django.urls import path
from . import views

urlpatterns = [
    path('victim/', views.victim_dashboard, name='victim_dashboard'),
    path('responder/', views.responder_dashboard, name='responder_dashboard'),
    
    # API endpoints for victims
    path('api/alerts/create/', views.create_alert, name='create_alert'),
    path('api/alerts/active/', views.active_alert, name='active_alert'),
    path('api/alerts/<int:alert_id>/', views.active_alert, name='alert_detail'),
    path('api/alerts/<int:alert_id>/messages/', views.alert_messages, name='alert_messages'),
    path('api/alerts/<int:alert_id>/messages/send/', views.send_message, name='send_message'),
    
    # API endpoints for responders
    path('api/responders/toggle_availability/', views.toggle_availability, name='toggle_availability'),
    path('api/responders/assignments/', views.responder_assignments, name='responder_assignments'),
    path('api/responders/assignments/<int:assignment_id>/', views.responder_assignments, name='assignment_detail'),
    path('api/responders/update_location/', views.update_responder_location, name='update_responder_location'),
    path('api/responders/assignments/<int:assignment_id>/update_status/', views.update_assignment_status, name='update_assignment_status'),
    path('api/responders/assignments/<int:assignment_id>/messages/', views.alert_messages, name='assignment_messages'),
    path('api/responders/assignments/<int:assignment_id>/messages/send/', views.send_message, name='send_assignment_message'),
]