from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import EmergencyAlert, EmergencyResponder, EmergencyMessage, EmergencyType
import json
from math import radians, sin, cos, sqrt, atan2
from django.views.decorators.csrf import csrf_exempt

def calculate_distance(lat1, lon1, lat2, lon2):
    # Approximate calculation (in km)
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