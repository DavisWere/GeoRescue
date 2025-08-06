document.addEventListener('DOMContentLoaded', function() {
    const trackingElements = document.querySelectorAll('.tracking');
    
    trackingElements.forEach(element => {
        const alertId = element.getAttribute('data-alert-id');
        const victimLat = parseFloat(element.getAttribute('data-victim-lat'));
        const victimLon = parseFloat(element.getAttribute('data-victim-lon'));
        const responderLat = element.getAttribute('data-responder-lat');
        const responderLon = element.getAttribute('data-responder-lon');
        
        if (responderLat && responderLon) {
            const distance = calculateDistance(
                victimLat, victimLon, 
                parseFloat(responderLat), parseFloat(responderLon)
            );
            
            element.innerHTML = `
                <p>Responder is ${distance.toFixed(2)} km away</p>
                <p>Last updated: ${new Date().toLocaleTimeString()}</p>
            `;
            
            // In a real app, you would set up WebSocket or polling to update this
        } else {
            element.innerHTML = '<p>Waiting for responder assignment</p>';
        }
    });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
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

function radians(degrees) {
    return degrees * Math.PI / 180;
}


document.addEventListener('DOMContentLoaded', function() {
    // Function to calculate distance between two coordinates (Haversine formula)
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

    function radians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Function to simulate responder movement
    function simulateMovement(trackingContainer) {
        const alertId = trackingContainer.getAttribute('data-alert-id');
        const victimLat = parseFloat(trackingContainer.getAttribute('data-victim-lat'));
        const victimLon = parseFloat(trackingContainer.getAttribute('data-victim-lon'));
        let responderLat = parseFloat(trackingContainer.getAttribute('data-responder-lat'));
        let responderLon = parseFloat(trackingContainer.getAttribute('data-responder-lon'));
        
        if (isNaN(victimLat) || isNaN(victimLon) || isNaN(responderLat) || isNaN(responderLon)) {
            return;
        }

        const map = trackingContainer.querySelector('.tracking-map');
        const responderMarker = trackingContainer.querySelector('.responder-marker');
        const pathLine = trackingContainer.querySelector('.path-line');
        const distanceValue = trackingContainer.querySelector('.distance-value');
        const etaValue = trackingContainer.querySelector('.eta-value');
        
        // Initial distance calculation
        let distance = calculateDistance(victimLat, victimLon, responderLat, responderLon);
        let eta = Math.max(5, Math.min(60, Math.round(distance * 3))); // Simple ETA calculation (3 min per km)
        
        // Initial positions (victim is always at center)
        const victimX = 50;
        const victimY = 50;
        
        // Convert coordinates to map positions
        function updatePositions() {
            // Calculate relative position (simplified for demo)
            const latDiff = victimLat - responderLat;
            const lonDiff = victimLon - responderLon;
            
            // Scale factors to fit in our map
            const scale = 30; // Adjust this to change how much the responder moves
            let responderX = victimX + (lonDiff * scale);
            let responderY = victimY + (latDiff * scale);
            
            // Ensure the responder stays within bounds
            responderX = Math.max(5, Math.min(95, responderX));
            responderY = Math.max(5, Math.min(95, responderY));
            
            // Update marker positions
            responderMarker.style.left = responderX + '%';
            responderMarker.style.top = responderY + '%';
            
            // Update path line
            const lineLength = Math.sqrt(
                Math.pow(responderX - victimX, 2) + 
                Math.pow(responderY - victimY, 2)
            );
            const lineAngle = Math.atan2(
                victimY - responderY, 
                victimX - responderX
            ) * 180 / Math.PI;
            
            pathLine.style.width = lineLength + '%';
            pathLine.style.left = responderX + '%';
            pathLine.style.top = responderY + '%';
            pathLine.style.transform = `rotate(${lineAngle}deg)`;
            
            // Update distance and ETA
            distanceValue.textContent = distance.toFixed(2) + ' km';
            etaValue.textContent = eta + ' minutes';
        }
        
        // Initial update
        updatePositions();
        
        // Simulate movement every second
        const intervalId = setInterval(() => {
            if (distance <= 0.1) { // Arrived (within 100m)
                clearInterval(intervalId);
                distanceValue.textContent = 'Arrived!';
                etaValue.textContent = '0 minutes';
                return;
            }
            
            // Move responder 5% closer each update
            responderLat = responderLat + (victimLat - responderLat) * 0.05;
            responderLon = responderLon + (victimLon - responderLon) * 0.05;
            
            // Recalculate distance
            distance = calculateDistance(victimLat, victimLon, responderLat, responderLon);
            eta = Math.max(1, Math.round(eta * 0.9)); // Reduce ETA by 10% each update
            
            updatePositions();
        }, 1000); // Update every second
        
        // Store interval ID so we can clear it later if needed
        trackingContainer.dataset.intervalId = intervalId;
    }

    // Initialize tracking for all active alerts
    document.querySelectorAll('.tracking-container').forEach(container => {
        simulateMovement(container);
    });
});