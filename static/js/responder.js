// This would be in static/js/responder.js
$(document).ready(function() {
    let currentAssignmentId = null;
    let assignmentPosition = null;
    let responderPosition = null;
    let map = null;
    let assignmentMarker = null;
    let responderMarker = null;
    let positionUpdateInterval = null;

    // Check for assignments on page load
    checkAssignments();

    // Toggle availability
    $('#toggle-availability').click(function() {
        $.ajax({
            url: '/api/responders/toggle_availability/',
            method: 'POST',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                $('#toggle-availability').text(
                    response.is_available ? 'Mark as Unavailable' : 'Mark as Available'
                );
            }
        });
    });

    function checkAssignments() {
        $.ajax({
            url: '/api/responders/assignments/',
            method: 'GET',
            success: function(response) {
                $('#assignments-list').empty();
                
                if (response.assignments.length > 0) {
                    response.assignments.forEach(function(assignment) {
                        $('#assignments-list').append(
                            `<div class="assignment" data-id="${assignment.id}">
                                <h4>${assignment.emergency_type}</h4>
                                <p>Status: ${assignment.status}</p>
                                <p>Location: ${assignment.latitude}, ${assignment.longitude}</p>
                                <button class="view-assignment">View Details</button>
                            </div>`
                        );
                    });
                    
                    // If there's only one assignment, show it by default
                    if (response.assignments.length === 1) {
                        showAssignmentDetails(response.assignments[0].id);
                    }
                }
            }
        });
    }

    // View assignment details
    $(document).on('click', '.view-assignment', function() {
        const assignmentId = $(this).closest('.assignment').data('id');
        showAssignmentDetails(assignmentId);
    });

    function showAssignmentDetails(assignmentId) {
        $.ajax({
            url: '/api/responders/assignments/' + assignmentId + '/',
            method: 'GET',
            success: function(response) {
                currentAssignmentId = response.assignment.id;
                assignmentPosition = {
                    lat: parseFloat(response.assignment.latitude),
                    lng: parseFloat(response.assignment.longitude)
                };
                
                $('#assignment-type').text(response.assignment.emergency_type);
                $('#assignment-location').text(response.assignment.latitude + ', ' + response.assignment.longitude);
                $('#assignment-description').text(response.assignment.description);
                
                $('#active-assignments').hide();
                $('#assignment-details').show();
                
                initAssignmentMap();
                loadAssignmentMessages();
                
                // Start updating responder position
                if (navigator.geolocation) {
                    updateResponderPosition();
                    positionUpdateInterval = setInterval(updateResponderPosition, 5000);
                }
            }
        });
    }

    function initAssignmentMap() {
        // Initialize map
        map = new google.maps.Map(document.getElementById('assignment-map'), {
            center: assignmentPosition,
            zoom: 15
        });
        
        // Add assignment marker
        assignmentMarker = new google.maps.Marker({
            position: assignmentPosition,
            map: map,
            title: 'Emergency Location'
        });
        
        // Add responder marker if position is available
        if (responderPosition) {
            responderMarker = new google.maps.Marker({
                position: responderPosition,
                map: map,
                title: 'Your Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });
        }
    }

    function updateResponderPosition() {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                responderPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update marker on map
                if (responderMarker) {
                    responderMarker.setPosition(responderPosition);
                } else if (map) {
                    responderMarker = new google.maps.Marker({
                        position: responderPosition,
                        map: map,
                        title: 'Your Location',
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                }
                
                // Send position to server
                $.ajax({
                    url: '/api/responders/update_location/',
                    method: 'POST',
                    data: {
                        latitude: responderPosition.lat,
                        longitude: responderPosition.lng,
                        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                    }
                });
            },
            function(error) {
                console.error('Error getting position:', error);
            }
        );
    }

    function loadAssignmentMessages() {
        $.ajax({
            url: '/api/responders/assignments/' + currentAssignmentId + '/messages/',
            method: 'GET',
            success: function(response) {
                $('#assignment-messages').empty();
                response.messages.forEach(function(message) {
                    const messageClass = message.is_from_responder ? 'responder-message' : 'user-message';
                    $('#assignment-messages').append(
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
    $('#send-assignment-message').click(function() {
        const message = $('#assignment-message-input').val();
        if (message.trim() === '') return;
        
        $.ajax({
            url: '/api/responders/assignments/' + currentAssignmentId + '/messages/',
            method: 'POST',
            data: {
                message: message,
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function() {
                $('#assignment-message-input').val('');
                loadAssignmentMessages();
            }
        });
    });

    // Update status
    $('#update-status').click(function() {
        const newStatus = prompt('Enter new status (dispatched, in_progress, resolved):');
        if (newStatus) {
            $.ajax({
                url: '/api/responders/assignments/' + currentAssignmentId + '/update_status/',
                method: 'POST',
                data: {
                    status: newStatus,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function() {
                    alert('Status updated successfully');
                    checkAssignments();
                    
                    if (newStatus === 'resolved') {
                        clearInterval(positionUpdateInterval);
                        $('#assignment-details').hide();
                        $('#active-assignments').show();
                    }
                }
            });
        }
    });

    // Periodically check for new messages and assignments
    setInterval(function() {
        if (currentAssignmentId) {
            loadAssignmentMessages();
        } else {
            checkAssignments();
        }
    }, 3000);
});