document.addEventListener('DOMContentLoaded', function () {
    // ... [previous code remains the same until initializeTracking()] ...

    function initializeTracking() {
        const trackingContainers = document.querySelectorAll('.tracking-container');
        
        trackingContainers.forEach(container => {
            const alertId = container.dataset.alertId;
            const victimLat = parseFloat(container.dataset.victimLat);
            const victimLon = parseFloat(container.dataset.victimLon);
            const responderLat = parseFloat(container.dataset.responderLat);
            const responderLon = parseFloat(container.dataset.responderLon);

            if (victimLat && victimLon && responderLat && responderLon) {
                updateTrackingDisplay(container, victimLat, victimLon, responderLat, responderLon);
                
                // Simulate movement by gradually reducing distance
                simulateResponderMovement(container, victimLat, victimLon, responderLat, responderLon);
            } else {
                // No responder assigned yet
                const distanceValue = container.querySelector('.distance-value');
                const etaValue = container.querySelector('.eta-value');
                const responderMarker = container.querySelector('.responder-marker');
                const pathLine = container.querySelector('.path-line');
                
                if (distanceValue) distanceValue.textContent = 'Waiting for responder';
                if (etaValue) etaValue.textContent = 'Pending assignment';
                if (responderMarker) responderMarker.style.display = 'none';
                if (pathLine) pathLine.style.display = 'none';
            }
        });
    }

    function updateTrackingDisplay(container, victimLat, victimLon, responderLat, responderLon) {
        const distance = calculateDistance(victimLat, victimLon, responderLat, responderLon);
        const eta = calculateETA(distance);
        
        // Update distance and ETA
        const distanceValue = container.querySelector('.distance-value');
        const etaValue = container.querySelector('.eta-value');
        
        if (distanceValue) {
            distanceValue.textContent = distance < 1 ? 
                `${Math.round(distance * 1000)}m` : 
                `${distance.toFixed(1)}km`;
        }
        
        if (etaValue) {
            etaValue.textContent = eta;
        }

        // Update visual elements
        updateTrackingVisuals(container, victimLat, victimLon, responderLat, responderLon);
    }

    function updateTrackingVisuals(container, victimLat, victimLon, responderLat, responderLon) {
        const map = container.querySelector('.tracking-map');
        const pathLine = container.querySelector('.path-line');
        const responderMarker = container.querySelector('.responder-marker');
        const victimMarker = container.querySelector('.victim-marker');
        
        if (!map || !pathLine || !responderMarker || !victimMarker) return;

        // Calculate relative positions
        const latDiff = responderLat - victimLat;
        const lonDiff = responderLon - victimLon;
        
        // Scale factors to fit in our map (adjust these based on your needs)
        const latScale = 5000; // 1 degree latitude ≈ 111km
        const lonScale = 5000; // Adjust based on your location
        
        // Calculate positions (victim at center)
        const victimX = 50; // 50% of container
        const victimY = 50; // 50% of container
        
        // Calculate responder position relative to victim
        let responderX = victimX + (lonDiff * lonScale);
        let responderY = victimY + (latDiff * latScale);
        
        // Ensure the responder stays within bounds
        responderX = Math.max(10, Math.min(90, responderX));
        responderY = Math.max(10, Math.min(90, responderY));
        
        // Update marker positions
        responderMarker.style.left = responderX + '%';
        responderMarker.style.top = responderY + '%';
        
        // Update path line
        const lineLength = Math.sqrt(
            Math.pow(responderX - victimX, 2) + 
            Math.pow(responderY - victimY, 2)
        );
        const lineAngle = Math.atan2(
            responderY - victimY, 
            responderX - victimX
        ) * 180 / Math.PI;
        
        pathLine.style.width = lineLength + '%';
        pathLine.style.left = victimX + '%';
        pathLine.style.top = victimY + '%';
        pathLine.style.transform = `rotate(${lineAngle}deg)`;
    }

    function simulateResponderMovement(container, victimLat, victimLon, responderLat, responderLon) {
        let currentLat = responderLat;
        let currentLon = responderLon;
        
        const intervalId = setInterval(() => {
            // Calculate distance to victim
            const distance = calculateDistance(victimLat, victimLon, currentLat, currentLon);
            
            if (distance <= 0.1) { // Arrived (within 100m)
                clearInterval(intervalId);
                
                // Update display with arrival message
                const distanceValue = container.querySelector('.distance-value');
                const etaValue = container.querySelector('.eta-value');
                const responderMarker = container.querySelector('.responder-marker');
                
                if (distanceValue) distanceValue.textContent = 'Arrived!';
                if (etaValue) etaValue.textContent = '0 minutes';
                if (responderMarker) responderMarker.style.backgroundColor = 'green';
                
                return;
            }
            
            // Move responder 5% closer to victim each update
            currentLat = currentLat + (victimLat - currentLat) * 0.05;
            currentLon = currentLon + (victimLon - currentLon) * 0.05;
            
            // Update the display
            updateTrackingDisplay(container, victimLat, victimLon, currentLat, currentLon);
        }, 1000); // Update every second
        
        // Store interval ID on container for cleanup
        container.dataset.intervalId = intervalId;
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula implementation
        const R = 6371; // Earth radius in km
        const dLat = radians(lat2 - lat1);
        const dLon = radians(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function calculateETA(distance) {
        // Simple ETA calculation (average speed of 60km/h)
        const hours = distance / 60;
        const minutes = Math.ceil(hours * 60);
        
        if (minutes <= 1) return 'Less than 1 minute';
        return `${minutes} minutes`;
    }

    function radians(degrees) {
        return degrees * Math.PI / 180;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // 1. Location Button Functionality
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const submitBtn = document.getElementById('submitBtn');
    const emergencyForm = document.getElementById('emergencyForm');

    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', function() {
            updateLocationStatus("Detecting your location...", 'loading');
            
            const originalContent = getLocationBtn.innerHTML;
            getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
            getLocationBtn.disabled = true;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const accuracy = position.coords.accuracy;

                        latitudeInput.value = lat;
                        longitudeInput.value = lng;

                        let statusMessage = `Location found: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                        if (accuracy) {
                            statusMessage += ` (±${Math.round(accuracy)}m)`;
                        }
                        
                        updateLocationStatus(statusMessage, 'success');
                        submitBtn.disabled = false;
                        getLocationBtn.innerHTML = originalContent;
                        getLocationBtn.disabled = false;
                    },
                    function(error) {
                        let errorMessage = "Error: ";
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += "Location permission denied";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += "Location unavailable";
                                break;
                            case error.TIMEOUT:
                                errorMessage += "Request timed out";
                                break;
                            default:
                                errorMessage += "Unknown error";
                        }
                        
                        updateLocationStatus(errorMessage, 'error');
                        submitBtn.disabled = true;
                        getLocationBtn.innerHTML = originalContent;
                        getLocationBtn.disabled = false;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                updateLocationStatus("Geolocation not supported", 'error');
                submitBtn.disabled = true;
                getLocationBtn.innerHTML = originalContent;
                getLocationBtn.disabled = false;
            }
        });
    }

    function updateLocationStatus(message, type) {
        if (locationStatus) {
            locationStatus.textContent = message;
            locationStatus.className = `location-status ${type}`;
        }
    }

    // 2. Tracking Simulation Functionality
    function initializeTracking() {
        const trackingContainers = document.querySelectorAll('.tracking-container');
        
        trackingContainers.forEach(container => {
            const victimLat = parseFloat(container.dataset.victimLat);
            const victimLon = parseFloat(container.dataset.victimLon);
            const responderLat = parseFloat(container.dataset.responderLat);
            const responderLon = parseFloat(container.dataset.responderLon);

            if (!isNaN(victimLat) && !isNaN(victimLon) && 
                !isNaN(responderLat) && !isNaN(responderLon)) {
                updateTrackingDisplay(container, victimLat, victimLon, responderLat, responderLon);
                simulateResponderMovement(container, victimLat, victimLon, responderLat, responderLon);
            } else {
                const distanceValue = container.querySelector('.distance-value');
                const etaValue = container.querySelector('.eta-value');
                const responderMarker = container.querySelector('.responder-marker');
                const pathLine = container.querySelector('.path-line');
                
                if (distanceValue) distanceValue.textContent = 'Waiting for responder';
                if (etaValue) etaValue.textContent = '--';
                if (responderMarker) responderMarker.style.display = 'none';
                if (pathLine) pathLine.style.display = 'none';
            }
        });
    }

    function updateTrackingDisplay(container, victimLat, victimLon, responderLat, responderLon) {
        const distance = calculateDistance(victimLat, victimLon, responderLat, responderLon);
        const eta = calculateETA(distance);
        
        const distanceValue = container.querySelector('.distance-value');
        const etaValue = container.querySelector('.eta-value');
        
        if (distanceValue) {
            distanceValue.textContent = distance < 1 ? 
                `${Math.round(distance * 1000)}m` : 
                `${distance.toFixed(1)}km`;
        }
        
        if (etaValue) {
            etaValue.textContent = eta;
        }

        updateTrackingVisuals(container, victimLat, victimLon, responderLat, responderLon);
    }

    function updateTrackingVisuals(container, victimLat, victimLon, responderLat, responderLon) {
        const map = container.querySelector('.tracking-map');
        const pathLine = container.querySelector('.path-line');
        const responderMarker = container.querySelector('.responder-marker');
        
        if (!map || !pathLine || !responderMarker) return;

        const victimX = 50; // Center of map
        const victimY = 50;
        
        // Calculate relative position (simplified for demo)
        const latDiff = victimLat - responderLat;
        const lonDiff = victimLon - responderLon;
        const scale = 5000; // Adjust this to control marker spread
        
        let responderX = victimX + (lonDiff * scale);
        let responderY = victimY + (latDiff * scale);
        
        // Keep within bounds
        responderX = Math.max(10, Math.min(90, responderX));
        responderY = Math.max(10, Math.min(90, responderY));
        
        // Update positions
        responderMarker.style.left = responderX + '%';
        responderMarker.style.top = responderY + '%';
        
        // Update connecting line
        const lineLength = Math.sqrt(
            Math.pow(responderX - victimX, 2) + 
            Math.pow(responderY - victimY, 2)
        );
        const lineAngle = Math.atan2(
            responderY - victimY, 
            responderX - victimX
        ) * 180 / Math.PI;
        
        pathLine.style.width = lineLength + '%';
        pathLine.style.left = victimX + '%';
        pathLine.style.top = victimY + '%';
        pathLine.style.transform = `rotate(${lineAngle}deg)`;
    }

    function simulateResponderMovement(container, victimLat, victimLon, responderLat, responderLon) {
        let currentLat = responderLat;
        let currentLon = responderLon;
        let intervalId = container.dataset.intervalId;
        
        // Clear any existing interval
        if (intervalId) clearInterval(intervalId);
        
        intervalId = setInterval(() => {
            const distance = calculateDistance(victimLat, victimLon, currentLat, currentLon);
            
            if (distance <= 0.1) { // Arrived (within 100m)
                clearInterval(intervalId);
                
                const distanceValue = container.querySelector('.distance-value');
                const etaValue = container.querySelector('.eta-value');
                const responderMarker = container.querySelector('.responder-marker');
                
                if (distanceValue) distanceValue.textContent = 'Arrived!';
                if (etaValue) etaValue.textContent = '0 min';
                if (responderMarker) responderMarker.style.backgroundColor = '#28a745';
                
                return;
            }
            
            // Move 5% closer each update
            currentLat += (victimLat - currentLat) * 0.05;
            currentLon += (victimLon - currentLon) * 0.05;
            
            updateTrackingDisplay(container, victimLat, victimLon, currentLat, currentLon);
        }, 1000);
        
        container.dataset.intervalId = intervalId;
    }

    // Utility functions
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = radians(lat2 - lat1);
        const dLon = radians(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function calculateETA(distance) {
        const minutes = Math.ceil((distance / 60) * 60); // Assuming 60km/h
        return minutes <= 1 ? '1 min' : `${minutes} mins`;
    }

    function radians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Initialize tracking when page loads
    initializeTracking();
});