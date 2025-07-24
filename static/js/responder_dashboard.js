document.addEventListener('DOMContentLoaded', function () {
    // Location update functionality
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const updateLocationBtn = document.getElementById('updateLocationBtn');

    // Variables for tracking and real-time updates
    let currentAssignmentId = null;
    let assignmentPosition = null;
    let responderPosition = null;
    let positionUpdateInterval = null;

    // Initialize on page load
    initializeDashboard();

    // Location detection functionality
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', function () {
            locationStatus.textContent = "Detecting your location...";
            locationStatus.className = 'location-status';

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;

                        latitudeInput.value = lat;
                        longitudeInput.value = lng;

                        locationStatus.textContent = `Location ready to update: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                        locationStatus.className = 'location-status success';
                        updateLocationBtn.disabled = false;

                        if (position.coords.accuracy) {
                            locationStatus.textContent += ` (±${Math.round(position.coords.accuracy)}m accuracy)`;
                        }

                        // Store current responder position
                        responderPosition = {
                            lat: lat,
                            lng: lng
                        };

                        // Update distance calculations
                        updateDistanceCalculations();
                    },
                    function (error) {
                        let errorMessage = "Error: ";
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += "Location permission denied. Please enable location access.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += "Location information unavailable.";
                                break;
                            case error.TIMEOUT:
                                errorMessage += "Location request timed out. Please try again.";
                                break;
                            default:
                                errorMessage += "An unknown error occurred while retrieving location.";
                        }
                        locationStatus.textContent = errorMessage;
                        locationStatus.className = 'location-status error';
                    },
                    { 
                        enableHighAccuracy: true, 
                        timeout: 15000,
                        maximumAge: 60000 
                    }
                );
            } else {
                locationStatus.textContent = "Geolocation is not supported by this browser.";
                locationStatus.className = 'location-status error';
            }
        });
    }

    // Form submission handler
    const locationForm = document.getElementById('locationForm');
    if (locationForm) {
        locationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('updateLocationBtn');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            submitBtn.disabled = true;
            
            // Submit the form
            setTimeout(() => {
                this.submit();
            }, 500);
        });
    }

    // Initialize dashboard functionality
    function initializeDashboard() {
        // Calculate distances for all alerts on page load
        updateDistanceCalculations();
        
        // Start periodic updates if there are active assignments
        const alertCards = document.querySelectorAll('.alert-card');
        if (alertCards.length > 0) {
            startPeriodicUpdates();
        }

        // Auto-detect location on page load if no location is set
        const currentLat = latitudeInput ? parseFloat(latitudeInput.value) : 0;
        const currentLng = longitudeInput ? parseFloat(longitudeInput.value) : 0;
        
        if (currentLat === 0 && currentLng === 0) {
            autoDetectLocation();
        } else {
            responderPosition = {
                lat: currentLat,
                lng: currentLng
            };
        }
    }

    // Auto-detect location on page load
    function autoDetectLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    responderPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    updateDistanceCalculations();
                },
                function (error) {
                    console.log('Auto-location detection failed:', error.message);
                },
                { 
                    enableHighAccuracy: false, 
                    timeout: 5000,
                    maximumAge: 300000 
                }
            );
        }
    }

    // Calculate and update distances for all alerts
    function updateDistanceCalculations() {
        document.querySelectorAll('.distance').forEach(el => {
            const alertLat = parseFloat(el.getAttribute('data-alert-lat'));
            const alertLon = parseFloat(el.getAttribute('data-alert-lon'));
            const responderLat = parseFloat(el.getAttribute('data-responder-lat'));
            const responderLon = parseFloat(el.getAttribute('data-responder-lon'));

            // Use current position if available, otherwise use stored position
            const currentRespLat = responderPosition ? responderPosition.lat : responderLat;
            const currentRespLon = responderPosition ? responderPosition.lng : responderLon;

            if (!isNaN(alertLat) && !isNaN(alertLon) &&
                !isNaN(currentRespLat) && !isNaN(currentRespLon)) {
                const distance = calculateDistance(alertLat, alertLon, currentRespLat, currentRespLon);
                el.textContent = `${distance.toFixed(1)} km`;
                
                // Add visual indicator for distance
                if (distance < 1) {
                    el.style.color = 'var(--success-green)';
                    el.style.fontWeight = '600';
                } else if (distance < 5) {
                    el.style.color = 'var(--warning-yellow)';
                    el.style.fontWeight = '600';
                } else {
                    el.style.color = 'var(--primary-red)';
                    el.style.fontWeight = '600';
                }
            }
        });
    }

    // Enhanced distance calculation using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Start periodic updates for real-time functionality
    function startPeriodicUpdates() {
        // Update location every 30 seconds if geolocation is available
        if (navigator.geolocation) {
            positionUpdateInterval = setInterval(function() {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        responderPosition = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        updateDistanceCalculations();
                        
                        // Send position update to server (if needed)
                        updateServerLocation(position.coords.latitude, position.coords.longitude);
                    },
                    function(error) {
                        console.log('Periodic location update failed:', error.message);
                    },
                    { 
                        enableHighAccuracy: false, 
                        timeout: 10000,
                        maximumAge: 30000 
                    }
                );
            }, 30000); // Update every 30 seconds
        }

        // Periodically check for new assignments (every 2 minutes)
        setInterval(function() {
            checkForNewAssignments();
        }, 120000);
    }

    // Update server with current location
    function updateServerLocation(latitude, longitude) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!csrfToken) return;

        fetch('/api/responders/update_location/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken.value
            },
            body: `latitude=${latitude}&longitude=${longitude}&csrfmiddlewaretoken=${csrfToken.value}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Location updated successfully');
            }
        })
        .catch(error => {
            console.error('Error updating location:', error);
        });
    }

    // Check for new assignments
    function checkForNewAssignments() {
        fetch('/api/responders/assignments/')
        .then(response => response.json())
        .then(data => {
            if (data.assignments && data.assignments.length > 0) {
                // Check if there are new assignments
                const currentAssignments = document.querySelectorAll('.alert-card').length;
                if (data.assignments.length > currentAssignments) {
                    // New assignment detected - could trigger notification
                    showNotification('New emergency assignment received!', 'alert');
                    // Optionally reload the page to show new assignments
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            }
        })
        .catch(error => {
            console.error('Error checking assignments:', error);
        });
    }

    // Show notification (if you want to add notification functionality)
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'alert' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'alert' ? 'var(--primary-red)' : 'var(--success-green)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    // Enhanced alert card interactions
    document.querySelectorAll('.alert-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.view-messages-btn')) {
                // Add click ripple effect
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(220, 38, 38, 0.1);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });
    });

    // Add ripple animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (positionUpdateInterval) {
            clearInterval(positionUpdateInterval);
        }
    });

    // Add smooth scrolling to alert details links
    document.querySelectorAll('.view-messages-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
            } else {
                // If no href, scroll to top smoothly
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Print functionality
    document.querySelector('a[href="#"]:has(i.fa-print)')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.print();
    });

    // Status indicator animation enhancement
    const statusDot = document.querySelector('.status-dot');
    if (statusDot && statusDot.classList.contains('available')) {
        // Add breathing animation for available status
        statusDot.style.animation = 'pulse 2s infinite, breathe 4s infinite';
    }

    // Add breathing animation
    const breatheStyle = document.createElement('style');
    breatheStyle.textContent = `
        @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
    `;
    document.head.appendChild(breatheStyle);
});