from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('victim/dashboard/', views.victim_dashboard, name='victim_dashboard'),
    path('victim/alerts/<int:alert_id>/messages/', views.alert_messages, name='alert_messages'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('responder/dashboard/', views.responder_dashboard, name='responder_dashboard'),
    path('responder/alerts/<int:alert_id>/', views.responder_alert_detail, name='responder_alert_detail'),
   
]