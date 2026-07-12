/**
 * Interactive Donor Geolocation & Nearby Places mapping engine.
 */
let donorMap;
let donorLocationMarker;
let nearbyMarkers = [];
let geocoder;

function initDonorMap() {
    const mapElement = document.getElementById('donor-map');
    if (!mapElement) return;

    // Check if Google Maps script loaded successfully
    if (typeof google === 'undefined' || !google.maps) {
        console.warn("Google Maps JS API failed to load. Activating offline simulation.");
        renderOfflineDonorMap();
        return;
    }

    geocoder = new google.maps.Geocoder();

    const lat = parseFloat(mapElement.dataset.lat) || 17.6868;
    const lng = parseFloat(mapElement.dataset.lng) || 83.2185;
    const centerCoords = { lat: lat, lng: lng };

    // Initialize map with zoom controls and scale indicators
    donorMap = new google.maps.Map(mapElement, {
        zoom: 14,
        center: centerCoords,
        zoomControl: true,
        scaleControl: true,
        styles: getDarkMapStyles()
    });

    // Main Donor position marker (Green marker)
    donorLocationMarker = new google.maps.Marker({
        position: centerCoords,
        map: donorMap,
        title: "Your Location",
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        }
    });

    // Fetch and display address & nearby places
    reverseGeocodeCoords(lat, lng);
    loadNearbyServices(lat, lng);

    // Bind sync location button click handler
    setupSyncLocationButton();
}

/**
 * Reverse geocodes coordinates to display human-readable address.
 */
function reverseGeocodeCoords(lat, lng) {
    const addressEl = document.getElementById('donor-address');
    if (!addressEl || !geocoder) return;

    geocoder.geocode({ 'location': { lat: lat, lng: lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
            addressEl.textContent = results[0].formatted_address;
        } else {
            console.warn("Reverse geocode failed: " + status);
            // Keep default format if geocoding is unavailable
        }
    });
}

/**
 * Loads nearby hospitals, blood banks, and landmarks from API.
 */
function loadNearbyServices(lat, lng) {
    clearNearbyMarkers();
    
    const services = [
        { type: 'hospital', containerId: 'nearby-hospitals', icon: 'orange-dot.png', namePrefix: '<i class="fas fa-hospital text-warning me-2"></i>' },
        { type: 'blood_bank', containerId: 'nearby-blood-banks', icon: 'red-dot.png', namePrefix: '<i class="fas fa-hand-holding-water text-danger me-2"></i>' },
        { type: 'landmark', containerId: 'nearby-landmarks', icon: 'yellow-dot.png', namePrefix: '<i class="fas fa-landmark text-info me-2"></i>' }
    ];

    services.forEach(service => {
        const container = document.getElementById(service.containerId);
        if (container) {
            container.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning nearby...';
        }

        fetch(`/api/v1/hospitals/nearby?lat=${lat}&lng=${lng}&type=${service.type}`)
            .then(res => res.json())
            .then(data => {
                const places = data.places || [];
                if (container) {
                    if (places.length === 0) {
                        container.innerHTML = 'None found in 5 KM.';
                    } else {
                        container.innerHTML = '';
                        places.forEach(place => {
                            // Add list item
                            const div = document.createElement('div');
                            div.className = 'py-1 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center';
                            div.innerHTML = `
                                <span>${service.namePrefix}<strong>${place.name}</strong></span>
                                <span class="text-muted small">${place.address.split(',')[0]}</span>
                            `;
                            container.appendChild(div);

                            // Plot marker on map if active
                            if (donorMap) {
                                const placeMarker = new google.maps.Marker({
                                    position: { lat: parseFloat(place.lat), lng: parseFloat(place.lng) },
                                    map: donorMap,
                                    title: place.name,
                                    icon: {
                                        url: `http://maps.google.com/mapfiles/ms/icons/${service.icon}`
                                    }
                                });
                                nearbyMarkers.push(placeMarker);
                            }
                        });
                    }
                }
            })
            .catch(err => {
                if (container) {
                    container.innerHTML = 'Error fetching places.';
                }
            });
    });
}

function clearNearbyMarkers() {
    nearbyMarkers.forEach(m => m.setMap(null));
    nearbyMarkers = [];
}

/**
 * Handle browser geolocation synchronization.
 */
function setupSyncLocationButton() {
    const syncBtn = document.getElementById('sync-location-btn');
    if (!syncBtn) return;

    // Remove any previous event listeners (by cloning the button)
    const newSyncBtn = syncBtn.cloneNode(true);
    syncBtn.parentNode.replaceChild(newSyncBtn, syncBtn);

    newSyncBtn.addEventListener('click', () => {
        newSyncBtn.disabled = true;
        newSyncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching live coordinates...';

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your current browser.");
            newSyncBtn.disabled = false;
            newSyncBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Update Current Location';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // 1. Post coordinates to DB
                fetch('/api/v1/location/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: JSON.stringify({ latitude: lat, longitude: lng })
                })
                .then(res => res.json())
                .then(data => {
                    newSyncBtn.disabled = false;
                    newSyncBtn.innerHTML = '<i class="fas fa-map-marker-alt text-danger"></i> Update Current Location';

                    if (data.status === 'success') {
                        // 2. Refresh Google Map
                        if (donorMap && donorLocationMarker) {
                            const newPos = new google.maps.LatLng(lat, lng);
                            donorMap.setCenter(newPos);
                            donorLocationMarker.setPosition(newPos);
                        }

                        // 3. Display reverse geocoded address
                        reverseGeocodeCoords(lat, lng);

                        // 4. Update nearby places
                        loadNearbyServices(lat, lng);

                        // Show success alert
                        alert("Your current location has been updated successfully.");
                    } else {
                        alert("Failed to update database: " + data.error);
                    }
                })
                .catch(err => {
                    newSyncBtn.disabled = false;
                    newSyncBtn.innerHTML = '<i class="fas fa-map-marker-alt text-danger"></i> Update Current Location';
                    alert("API connection failed. Location not synced.");
                });
            },
            (error) => {
                newSyncBtn.disabled = false;
                newSyncBtn.innerHTML = '<i class="fas fa-map-marker-alt text-danger"></i> Update Current Location';
                
                let warningMsg = "Could not access live location. ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        warningMsg += "Permission denied by browser settings. Using previously registered address.";
                        break;
                    default:
                        warningMsg += "GPS signal unavailable. Using previously registered address.";
                        break;
                }
                alert(warningMsg);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    });
}

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

/**
 * Premium dark mode styling for the donor's map
 */
function getDarkMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#131a2c" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#131a2c" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#222f46" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b0f19" }] }
    ];
}

/**
 * Fallback mapping placeholder for offline developers
 */
function renderOfflineDonorMap() {
    const mapElement = document.getElementById('donor-map');
    if (!mapElement) return;

    mapElement.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center h-100 text-center p-4" style="background-color: #0b0f19; min-height:400px; border-radius:8px;">
            <i class="fas fa-satellite text-danger fa-3x mb-3 animate-pulse"></i>
            <h5 class="text-white">Offline Donor Map Mode</h5>
            <p class="text-muted small max-width-400">
                Google Maps JS API is offline. Real-time GPS synchronization and reverse geocoding are active. Nearby places are mocked using dynamic coordinates.
            </p>
        </div>
    `;

    const lat = parseFloat(mapElement.dataset.lat) || 17.6868;
    const lng = parseFloat(mapElement.dataset.lng) || 83.2185;
    
    // Load lists using mocks from API
    loadNearbyServices(lat, lng);
    setupSyncLocationButton();
}

// Bind to window context
window.initDonorMap = initDonorMap;
