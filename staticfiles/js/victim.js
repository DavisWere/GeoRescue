// This would be in static/js/victim.js
$(document).ready(function() {
    let currentAlertId = null;
    let responderPosition = null;
    let userPosition = null;
    let map = null;
    let responderMarker = null;
    let userMarker = null;
    let updateInterval = null;

    // Check for active alerts on page load
    checkActiveAlert();

    // Request help button
    $('#request-help').click(function() {
        const emergencyType = $('#emergency-type').val();
        const description = $('#emergency-description').val();
        
        if (!emergencyType) {
            alert('Please select an emergency type');
            return;
        }

        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    userPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    createAlert(emergencyType, description);
                },
                function(error) {
                    alert('Error getting your location. Please enable location services.');
                    console.error(error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    });

    function createAlert(emergencyType, description) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        const alertData = {
            emergency_type: emergencyType,
            description: description,
            latitude: userPosition.lat,
            longitude: userPosition.lng,
            csrfmiddlewaretoken: csrfToken  // Include CSRF token in the data
        };

        $.ajax({
            url: '/api/alerts/create/',
            method: 'POST',
            data: alertData,  // Send as regular form data
            dataType: 'json',  // Expect JSON response
            success: function(response) {
                currentAlertId = response.alert_id;
                $('#no-active-alert').hide();
                $('#active-alert').show();
                $('#alert-status').text('Pending');
                startTrackingResponder();
            },
            error: function(xhr) {
                let errorMsg = 'Error creating alert';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg += ': ' + xhr.responseJSON.error;
                }
                alert(errorMsg);
            }
        });
    }

    function checkActiveAlert() {
        $.ajax({
            url: '/api/alerts/active/',
            method: 'GET',
            success: function(response) {
                if (response.alert) {
                    currentAlertId = response.alert.id;
                    userPosition = {
                        lat: parseFloat(response.alert.latitude),
                        lng: parseFloat(response.alert.longitude)
                    };
                    
                    $('#no-active-alert').hide();
                    $('#active-alert').show();
                    $('#alert-status').text(response.alert.status);
                    
                    if (response.alert.assigned_responder) {
                        $('#assigned-responder').text(response.alert.assigned_responder.name);
                        responderPosition = {
                            lat: parseFloat(response.alert.assigned_responder.latitude),
                            lng: parseFloat(response.alert.assigned_responder.longitude)
                        };
                        startTrackingResponder();
                    }
                    
                    loadMessages();
                }
            }
        });
    }

    function startTrackingResponder() {
        // Initialize map
        initMap();
        
        // Start polling for responder updates
        updateInterval = setInterval(updateResponderPosition, 5000);
    }

    function initMap() {
        // Initialize Google Maps (or other mapping service)
        map = new google.maps.Map(document.getElementById('responder-map'), {
            center: userPosition,
            zoom: 15
        });
        
        // Add user marker
        userMarker = new google.maps.Marker({
            position: userPosition,
            map: map,
            title: 'Your location'
        });
        
        // Add responder marker if available
        if (responderPosition) {
            responderMarker = new google.maps.Marker({
                position: responderPosition,
                map: map,
                title: 'Responder',
                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
            
            // Calculate and display ETA
            calculateETA();
        }
    }

    function updateResponderPosition() {
        $.ajax({
            url: '/api/alerts/' + currentAlertId + '/',
            method: 'GET',
            success: function(response) {
                if (response.alert.assigned_responder) {
                    const newPosition = {
                        lat: parseFloat(response.alert.assigned_responder.latitude),
                        lng: parseFloat(response.alert.assigned_responder.longitude)
                    };
                    
                    if (!responderPosition || 
                        newPosition.lat !== responderPosition.lat || 
                        newPosition.lng !== responderPosition.lng) {
                        
                        responderPosition = newPosition;
                        
                        if (responderMarker) {
                            responderMarker.setPosition(responderPosition);
                        } else {
                            responderMarker = new google.maps.Marker({
                                position: responderPosition,
                                map: map,
                                title: 'Responder',
                                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            });
                        }
                        
                        calculateETA();
                    }
                    
                    $('#alert-status').text(response.alert.status);
                }
            }
        });
    }

    function calculateETA() {
        // Simulate ETA calculation based on distance
        if (userPosition && responderPosition) {
            const distance = calculateDistance(
                userPosition.lat, userPosition.lng,
                responderPosition.lat, responderPosition.lng
            );
            
            // Simple estimation: 1 minute per kilometer at 60km/h
            const eta = Math.round(distance * 1.5); // Adding some buffer
            $('#responder-eta').text(eta);
        }
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

    function loadMessages() {
        $.ajax({
            url: '/api/alerts/' + currentAlertId + '/messages/',
            method: 'GET',
            success: function(response) {
                $('#message-container').empty();
                response.messages.forEach(function(message) {
                    const messageClass = message.is_from_responder ? 'responder-message' : 'user-message';
                    $('#message-container').append(
                        `<div class="message ${messageClass}">
                            <p>${message.message}</p>
                            <small>${new Date(message.timestamp).toLocaleString()}</small>
                        </div>`
                    );
                });
            }
        });
    }

    // Send message
    $('#send-message').click(function() {
        const message = $('#message-input').val();
        if (message.trim() === '') return;
        
        $.ajax({
            url: '/api/alerts/' + currentAlertId + '/messages/',
            method: 'POST',
            data: {
                message: message,
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function() {
                $('#message-input').val('');
                loadMessages();
            }
        });
    });

    // Periodically check for new messages
    setInterval(function() {
        if (currentAlertId) {
            loadMessages();
        }
    }, 3000);
});