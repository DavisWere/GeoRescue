from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from .models import EmergencyType, EmergencyAlert, EmergencyResponder, EmergencyMessage
from math import radians, sin, cos, sqrt, atan2



def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            print(user)

            # Redirect based on user type
            if user.user_type == "responder":
                return redirect("responder_dashboard")
            elif user.user_type == "victim": 
                return redirect("victim_dashboard")
            elif user.is_superuser:
                return redirect("admin-dashboard")
            else:
                messages.error(request, "Unauthorized access")
                return redirect("index")  

        else:
            messages.error(request, "Invalid username or password")

    return render(request, "login.html")



def logout_view(request):
    logout(request)  
    return redirect('/')


@login_required
def victim_dashboard(request):
    if request.user.user_type != 'victim':
        return redirect('home')  # or wherever you want to redirect non-victims
    
    emergency_types = EmergencyType.objects.all()
    active_alerts = EmergencyAlert.objects.filter(user=request.user).order_by('-timestamp')
    
    if request.method == 'POST':
        emergency_type_id = request.POST.get('emergency_type')
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')
        description = request.POST.get('description', '')
        
        try:
            emergency_type = EmergencyType.objects.get(id=emergency_type_id)
            alert = EmergencyAlert.objects.create(
                user=request.user,
                emergency_type=emergency_type,
                latitude=latitude,
                longitude=longitude,
                description=description
            )
            
            # Find nearest available responder
            assign_nearest_responder(alert)
            
            messages.success(request, 'Emergency alert sent successfully!')
            return redirect('victim_dashboard')
        except Exception as e:
            messages.error(request, f'Error creating alert: {str(e)}')
    
    context = {
        'emergency_types': emergency_types,
        'active_alerts': active_alerts,
    }
    return render(request, 'victim_dashboard.html', context)

def assign_nearest_responder(alert):
    # Get all available responders for this emergency type
    responders = EmergencyResponder.objects.filter(
        emergency_types=alert.emergency_type,
        is_available=True
    )
    
    if not responders:
        return None
    
    # Calculate distances and find nearest
    nearest_responder = None
    min_distance = float('inf')
    
    alert_lat = radians(float(alert.latitude))
    alert_lon = radians(float(alert.longitude))
    
    for responder in responders:
        responder_lat = radians(float(responder.latitude))
        responder_lon = radians(float(responder.longitude))
        
        # Haversine formula to calculate distance
        dlon = responder_lon - alert_lon
        dlat = responder_lat - alert_lat
        a = sin(dlat / 2)**2 + cos(alert_lat) * cos(responder_lat) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance = 6371 * c  # Earth radius in km
        
        if distance < min_distance:
            min_distance = distance
            nearest_responder = responder
    
    if nearest_responder:
        alert.assigned_responder = nearest_responder
        alert.status = 'dispatched'
        alert.save()
        return nearest_responder
    return None

@login_required
def alert_messages(request, alert_id):
    try:
        alert = EmergencyAlert.objects.get(id=alert_id, user=request.user)
    except EmergencyAlert.DoesNotExist:
        messages.error(request, 'Alert not found')
        return redirect('victim_dashboard')
    
    if request.method == 'POST':
        message_text = request.POST.get('message')
        if message_text:
            EmergencyMessage.objects.create(
                alert=alert,
                sender=request.user,
                message=message_text,
                is_from_responder=False
            )
            return redirect('alert_messages', alert_id=alert.id)
    
    messages = EmergencyMessage.objects.filter(alert=alert).order_by('timestamp')
    
    context = {
        'alert': alert,
        'messages': messages,
    }
    return render(request, 'alert_messages.html', context)


@login_required
def responder_dashboard(request):
    if request.user.user_type != 'responder':
        return redirect('home')  # or appropriate redirect
    
    try:
        responder = EmergencyResponder.objects.get(user=request.user)
    except EmergencyResponder.DoesNotExist:
        messages.error(request, 'Responder profile not found')
        return redirect('home')
    
    # Get assigned alerts
    assigned_alerts = EmergencyAlert.objects.filter(
        assigned_responder=responder,
        status__in=['dispatched', 'in_progress']
    ).order_by('-timestamp')
    
    # Get completed alerts
    completed_alerts = EmergencyAlert.objects.filter(
        assigned_responder=responder,
        status='resolved'
    ).order_by('-timestamp')[:5]  # Show last 5 completed
    
    if request.method == 'POST':
        # Handle location update
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')
        
        if latitude and longitude:
            responder.latitude = latitude
            responder.longitude = longitude
            responder.save()
            messages.success(request, 'Location updated successfully')
            return redirect('responder_dashboard')
    
    context = {
        'responder': responder,
        'assigned_alerts': assigned_alerts,
        'completed_alerts': completed_alerts,
    }
    return render(request, 'responder_dashboard.html', context)

@login_required
def responder_alert_detail(request, alert_id):
    try:
        alert = EmergencyAlert.objects.get(
            id=alert_id,
            assigned_responder__user=request.user
        )
    except EmergencyAlert.DoesNotExist:
        messages.error(request, 'Alert not found or not assigned to you')
        return redirect('responder_dashboard')
    
    if request.method == 'POST':
        # Handle status update
        new_status = request.POST.get('status')
        if new_status in ['in_progress', 'resolved']:
            alert.status = new_status
            alert.save()
            messages.success(request, f'Alert status updated to {new_status}')
            return redirect('responder_alert_detail', alert_id=alert.id)
        
        # Handle message sending
        message_text = request.POST.get('message')
        if message_text:
            EmergencyMessage.objects.create(
                alert=alert,
                sender=request.user,
                message=message_text,
                is_from_responder=True
            )
            return redirect('responder_alert_detail', alert_id=alert.id)
    
    messages = EmergencyMessage.objects.filter(alert=alert).order_by('timestamp')
    
    context = {
        'alert': alert,
        'messages': messages,
    }
    return render(request, 'responder_alert_detail.html', context)