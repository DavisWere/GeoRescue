from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import EmergencyAlert, EmergencyResponder, EmergencyMessage, EmergencyType
import json
from math import radians, sin, cos, sqrt, atan2
from django.views.decorators.csrf import csrf_exempt

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance between two coordinates (in km)
    R = 6371.0  # Earth radius in km
    
    lat1 = radians(float(lat1))
    lon1 = radians(float(lon1))
    lat2 = radians(float(lat2))
    lon2 = radians(float(lon2))
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

@login_required
def dashboard(request):
    if request.user.user_type == 'responder':
        return responder_dashboard(request)
    return victim_dashboard(request)

def victim_dashboard(request):
    # Get user's active alert if exists
    active_alert = EmergencyAlert.objects.filter(user=request.user, status__in=['pending', 'dispatched', 'in_progress']).first()
    
    if request.method == 'POST' and not active_alert:
        lat = request.POST.get('lat')
        lng = request.POST.get('lng')
        emergency_type_id = request.POST.get('emergency_type')
        
        if lat and lng:
            emergency_type = EmergencyType.objects.get(id=emergency_type_id) if emergency_type_id else None
            
            alert = EmergencyAlert.objects.create(
                user=request.user,
                emergency_type=emergency_type,
                latitude=lat,
                longitude=lng,
                status='pending'
            )
            return redirect('dashboard')
    
    emergency_types = EmergencyType.objects.all()
    context = {
        'emergency_types': emergency_types,
        'active_alert': active_alert
    }
    
    if active_alert and active_alert.assigned_responder:
        # Calculate distance to responder
        responder = active_alert.assigned_responder
        distance = calculate_distance(
            active_alert.latitude, active_alert.longitude,
            responder.latitude, responder.longitude
        )
        context.update({
            'responder_distance': round(distance, 2),
            'responder': responder
        })
    
    return render(request, 'emergency/victim_dashboard.html', context)

def responder_dashboard(request):
    # Get responder profile
    responder = request.user.emergencyresponder
    
    # Get available alerts for responder's emergency types
    available_alerts = EmergencyAlert.objects.filter(
        status='pending',
        emergency_type__in=responder.emergency_types.all()
    ).exclude(user=request.user)
    
    # Get alerts assigned to this responder
    assigned_alerts = EmergencyAlert.objects.filter(
        assigned_responder=responder,
        status__in=['dispatched', 'in_progress']
    )
    
    if request.method == 'POST':
        alert_id = request.POST.get('alert_id')
        action = request.POST.get('action')
        
        if alert_id and action:
            alert = EmergencyAlert.objects.get(id=alert_id)
            
            if action == 'accept':
                alert.assigned_responder = responder
                alert.status = 'dispatched'
                responder.is_available = False
                responder.save()
            elif action == 'complete':
                alert.status = 'resolved'
                responder.is_available = True
                responder.save()
            
            alert.save()
            return redirect('dashboard')
    
    return render(request, 'emergency/responder_dashboard.html', {
        'available_alerts': available_alerts,
        'assigned_alerts': assigned_alerts,
        'responder': responder
    })

@login_required
def emergency_chat(request, alert_id):
    alert = get_object_or_404(EmergencyAlert, id=alert_id)
    
    # Verify user has access to this alert
    if request.user not in [alert.user, alert.assigned_responder.user]:
        return redirect('dashboard')
    
    if request.method == 'POST':
        message = request.POST.get('message')
        if message:
            is_responder = request.user == alert.assigned_responder.user if alert.assigned_responder else False
            EmergencyMessage.objects.create(
                alert=alert,
                sender=request.user,
                message=message,
                is_from_responder=is_responder
            )
    
    messages = EmergencyMessage.objects.filter(alert=alert).order_by('timestamp')
    return render(request, 'emergency/chat.html', {
        'alert': alert,
        'messages': messages
    })

@csrf_exempt
@login_required
def update_location(request):
    if request.method == 'POST' and request.user.user_type == 'responder':
        try:
            data = json.loads(request.body)
            lat = data.get('lat')
            lng = data.get('lng')
            
            responder = request.user.emergencyresponder
            responder.latitude = lat
            responder.longitude = lng
            responder.save()
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'invalid request'})

@login_required
def emergency_alert(request):
    if request.method == 'POST':
        lat = request.POST.get('lat')
        lng = request.POST.get('lng')
        emergency_type_id = request.POST.get('emergency_type')
        
        if lat and lng:
            emergency_type = EmergencyType.objects.get(id=emergency_type_id) if emergency_type_id else None
            
            alert = EmergencyAlert.objects.create(
                user=request.user,
                emergency_type=emergency_type,
                latitude=lat,
                longitude=lng,
                status='pending'
            )
            return redirect('responder_dispatch', alert_id=alert.id)
    
    emergency_types = EmergencyType.objects.all()
    return render(request, 'emergency/alert.html', {'emergency_types': emergency_types})

@login_required
def responder_dispatch(request, alert_id):
    alert = get_object_or_404(EmergencyAlert, id=alert_id, user=request.user)
    
    if request.method == 'POST':
        responder_id = request.POST.get('responder_id')
        if responder_id:
            responder = EmergencyResponder.objects.get(id=responder_id)
            alert.assigned_responder = responder
            alert.status = 'dispatched'
            alert.save()
            return redirect('emergency_chat', alert_id=alert.id)
    
    # Get responders for this emergency type
    responders = EmergencyResponder.objects.filter(
        is_available=True,
        emergency_types=alert.emergency_type
    )
    
    # Calculate distance for each responder
    responders_with_distance = []
    for responder in responders:
        distance = calculate_distance(
            alert.latitude, alert.longitude,
            responder.latitude, responder.longitude
        )
        responders_with_distance.append({
            'responder': responder,
            'distance': round(distance, 2)
        })
    
    # Sort by distance
    responders_with_distance.sort(key=lambda x: x['distance'])
    
    return render(request, 'emergency/dispatch.html', {
        'alert': alert,
        'responders': responders_with_distance[:5]  # Show top 5 nearest
    })

@login_required
def emergency_chat(request, alert_id):
    alert = get_object_or_404(EmergencyAlert, id=alert_id)
    
    if request.method == 'POST':
        message = request.POST.get('message')
        if message:
            is_responder = request.user == alert.assigned_responder.user if alert.assigned_responder else False
            EmergencyMessage.objects.create(
                alert=alert,
                sender=request.user,
                message=message,
                is_from_responder=is_responder
            )
    
    messages = EmergencyMessage.objects.filter(alert=alert).order_by('timestamp')
    return render(request, 'emergency/chat.html', {
        'alert': alert,
        'messages': messages
    })

@login_required
def status_update(request, alert_id):
    alert = get_object_or_404(EmergencyAlert, id=alert_id)
    
    if request.method == 'POST' and alert.assigned_responder and request.user == alert.assigned_responder.user:
        new_status = request.POST.get('status')
        if new_status in dict(EmergencyAlert.STATUS_CHOICES).keys():
            alert.status = new_status
            alert.save()
    
    return render(request, 'emergency/status.html', {'alert': alert})

@csrf_exempt
@login_required
def update_location(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            lat = data.get('lat')
            lng = data.get('lng')
            
            responder = request.user.emergencyresponder
            responder.latitude = lat
            responder.longitude = lng
            responder.save()
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'invalid request'})