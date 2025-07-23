from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import EmergencyType, EmergencyAlert, EmergencyResponder, EmergencyMessage
from django.views.decorators.csrf import csrf_exempt
import json

@login_required
def victim_dashboard(request):
    if request.user.user_type != 'victim':
        return redirect('responder_dashboard')
    
    emergency_types = EmergencyType.objects.all()
    return render(request, 'victim_dashboard.html', {
        'emergency_types': emergency_types
    })

@login_required
def responder_dashboard(request):
    if request.user.user_type != 'responder':
        return redirect('victim_dashboard')
    
    try:
        responder = EmergencyResponder.objects.get(user=request.user)
    except EmergencyResponder.DoesNotExist:
        return redirect('logout')
    
    return render(request, 'responder_dashboard.html', {
        'responder': responder
    })

# API Views
@login_required
@csrf_exempt
def create_alert(request):
    if request.method == 'POST' and request.user.user_type == 'victim':
        try:
            # Get data from request.POST instead of request.body
            data = {
                'emergency_type': request.POST.get('emergency_type'),
                'description': request.POST.get('description', ''),
                'latitude': request.POST.get('latitude'),
                'longitude': request.POST.get('longitude')
            }

            # Validate required fields
            if not data['emergency_type']:
                return JsonResponse({'error': 'Emergency type is required'}, status=400)
            if not data['latitude'] or not data['longitude']:
                return JsonResponse({'error': 'Location coordinates are required'}, status=400)

            # Get emergency type
            try:
                emergency_type = EmergencyType.objects.get(id=data['emergency_type'])
            except EmergencyType.DoesNotExist:
                return JsonResponse({'error': 'Invalid emergency type'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'Emergency type must be a number'}, status=400)

            # Create alert
            alert = EmergencyAlert.objects.create(
                user=request.user,
                emergency_type=emergency_type,
                latitude=data['latitude'],
                longitude=data['longitude'],
                description=data['description']
            )
            
            return JsonResponse({'alert_id': alert.id})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method or user type'}, status=400)

@login_required
def active_alert(request):
    if request.user.user_type == 'victim':
        alert = EmergencyAlert.objects.filter(
            user=request.user,
            status__in=['pending', 'dispatched', 'in_progress']
        ).first()
        
        if alert:
            data = {
                'alert': {
                    'id': alert.id,
                    'emergency_type': alert.emergency_type.name if alert.emergency_type else 'Unknown',
                    'latitude': str(alert.latitude),
                    'longitude': str(alert.longitude),
                    'status': alert.get_status_display(),
                    'assigned_responder': {
                        'name': alert.assigned_responder.user.get_full_name(),
                        'latitude': str(alert.assigned_responder.latitude),
                        'longitude': str(alert.assigned_responder.longitude)
                    } if alert.assigned_responder else None
                }
            }
            return JsonResponse(data)
    
    return JsonResponse({'alert': None})

@login_required
def alert_messages(request, alert_id):
    alert = EmergencyAlert.objects.get(id=alert_id, user=request.user)
    messages = EmergencyMessage.objects.filter(alert=alert).order_by('timestamp')
    
    data = {
        'messages': [
            {
                'message': msg.message,
                'timestamp': msg.timestamp.isoformat(),
                'is_from_responder': msg.is_from_responder
            } for msg in messages
        ]
    }
    return JsonResponse(data)

@login_required
@csrf_exempt
def send_message(request, alert_id):
    if request.method == 'POST':
        alert = EmergencyAlert.objects.get(id=alert_id, user=request.user)
        data = json.loads(request.body)
        
        EmergencyMessage.objects.create(
            alert=alert,
            sender=request.user,
            message=data['message'],
            is_from_responder=False
        )
        return JsonResponse({'status': 'success'})
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

# Responder API Views
@login_required
@csrf_exempt
def toggle_availability(request):
    if request.method == 'POST' and request.user.user_type == 'responder':
        responder = EmergencyResponder.objects.get(user=request.user)
        responder.is_available = not responder.is_available
        responder.save()
        return JsonResponse({'is_available': responder.is_available})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def responder_assignments(request):
    if request.user.user_type == 'responder':
        responder = EmergencyResponder.objects.get(user=request.user)
        assignments = EmergencyAlert.objects.filter(
            assigned_responder=responder,
            status__in=['dispatched', 'in_progress']
        )
        
        data = {
            'assignments': [
                {
                    'id': alert.id,
                    'emergency_type': alert.emergency_type.name,
                    'latitude': str(alert.latitude),
                    'longitude': str(alert.longitude),
                    'status': alert.get_status_display(),
                    'description': alert.description
                } for alert in assignments
            ]
        }
        return JsonResponse(data)
    
    return JsonResponse({'error': 'Unauthorized'}, status=403)

@login_required
@csrf_exempt
def update_responder_location(request):
    if request.method == 'POST' and request.user.user_type == 'responder':
        data = json.loads(request.body)
        responder = EmergencyResponder.objects.get(user=request.user)
        responder.latitude = data['latitude']
        responder.longitude = data['longitude']
        responder.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
@csrf_exempt
def update_assignment_status(request, assignment_id):
    if request.method == 'POST' and request.user.user_type == 'responder':
        data = json.loads(request.body)
        responder = EmergencyResponder.objects.get(user=request.user)
        alert = EmergencyAlert.objects.get(id=assignment_id, assigned_responder=responder)
        
        if data['status'] in dict(EmergencyAlert.STATUS_CHOICES).keys():
            alert.status = data['status']
            alert.save()
            return JsonResponse({'status': 'success'})
    
    return JsonResponse({'error': 'Invalid request'}, status=400)