/**
 * Google Maps integration script for Blood Donor Finder System.
 */
let map;
let directionsService;
let directionsRenderer;
let donorMarkers = [];
let radiusCircle;

function initMap() {
    // Check if Google Maps script loaded successfully
    if (typeof google === 'undefined' || !google.maps) {
        console.warn("Google Maps API failed to load or is unconfigured. Running in Mock Map mode.");
        renderMapOfflinePlaceholder();
        return;
    }

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: "#e03131",
            strokeOpacity: 0.8,
            strokeWeight: 5
        }
    });

    // Reference center coordinates (defaulting to Vizag center if unavailable)
    const refLat = parseFloat(document.getElementById('map-canvas').dataset.lat) || 17.6868;
    const refLng = parseFloat(document.getElementById('map-canvas').dataset.lng) || 83.2185;
    const searchRadius = parseFloat(document.getElementById('map-canvas').dataset.radius) || 10.0;

    const centerCoords = { lat: refLat, lng: refLng };

    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 13,
        center: centerCoords,
        styles: getDarkMapStyles() // Premium dark mode theme styles
    });

    directionsRenderer.setMap(map);

    // Place Recipient/Search Center Marker
    new google.maps.Marker({
        position: centerCoords,
        map: map,
        title: "Your Search Location",
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });

    // Draw Radius Limit Circle
    radiusCircle = new google.maps.Circle({
        strokeColor: "#ff6b6b",
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: "#e03131",
        fillOpacity: 0.05,
        map: map,
        center: centerCoords,
        radius: searchRadius * 1000 // Convert KM to meters
    });

    // Load and mark nearby donors
    const donorsDataEl = document.getElementById('donors-json-data');
    if (donorsDataEl) {
        try {
            const donors = JSON.parse(donorsDataEl.textContent);
            plotDonorMarkers(donors, centerCoords);
        } catch (e) {
            console.error("Could not parse donor coordinates for map: ", e);
        }
    }
}

/**
 * Renders markers for compatible available donors.
 */
function plotDonorMarkers(donors, centerCoords) {
    const infoWindow = new google.maps.InfoWindow();

    donors.forEach(donor => {
        if (!donor.lat || !donor.lng) return;

        const position = { lat: parseFloat(donor.lat), lng: parseFloat(donor.lng) };
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: donor.name,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }
        });

        // Click to open info popup (adhering to privacy: name, blood group, availability, and distance only)
        marker.addListener('click', () => {
            const popupContent = `
                <div class="map-info-popup">
                    <h6>${donor.name}</h6>
                    <p style="margin: 2px 0;"><strong>Blood Group:</strong> ${donor.blood_group}</p>
                    <p style="margin: 2px 0;"><strong>Distance:</strong> ${donor.distance_km} KM</p>
                    <p style="margin: 2px 0;"><strong>Status:</strong> <span style="color:#2b8a3e; font-weight:bold;">Available</span></p>
                    <button class="btn btn-sm btn-danger mt-2" onclick="calculateRoute({lat: ${centerCoords.lat}, lng: ${centerCoords.lng}}, {lat: ${position.lat}, lng: ${position.lng}})">
                        Get Route Directions
                    </button>
                </div>
            `;
            infoWindow.setContent(popupContent);
            infoWindow.open(map, marker);
        });

        donorMarkers.push(marker);
    });
}

/**
 * Calculates and plots route navigation line.
 */
function calculateRoute(origin, destination) {
    if (!directionsService) return;
    
    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            
            // Render directions list text below map if dashboard containers exist
            const routePanel = document.getElementById('route-directions-panel');
            if (routePanel) {
                routePanel.style.display = 'block';
                routePanel.innerHTML = `
                    <h5 class="mb-3 text-danger"><i class="fas fa-route"></i> Route Guidance Info</h5>
                    <p>Total Distance: <strong>${result.routes[0].legs[0].distance.text}</strong></p>
                    <p>Estimated Travel Time: <strong>${result.routes[0].legs[0].duration.text}</strong></p>
                `;
            }
        } else {
            alert("Route calculation failed: " + status);
        }
    });
}

/**
 * Custom dark mode style profile for premium aesthetics.
 */
function getDarkMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#131a2c" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#131a2c" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }]
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }]
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#132338" }]
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }]
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#222f46" }]
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1b273a" }]
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b9" }]
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#e03131" }, { opacity: 0.2 }]
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0b0f19" }]
        }
    ];
}

/**
 * Graceful fallback when the user is offline or has no Google Maps credentials.
 */
function renderMapOfflinePlaceholder() {
    const canvas = document.getElementById('map-canvas');
    if (canvas) {
        canvas.innerHTML = `
            <div class="d-flex flex-column justify-content-center align-items-center h-100 bg-secondary-dark text-center p-4" style="background-color: #131a2c; min-height:400px; border-radius:16px;">
                <i class="fas fa-map-marked-alt text-danger fa-3x mb-3"></i>
                <h5 class="text-white">Offline Map Mode Active</h5>
                <p class="text-muted max-width-400">
                    Google Maps JS API is offline or unconfigured. Real-time mapping markers are mocked in tables, and coordinates calculations are processing via backend.
                </p>
                <div class="badge bg-danger">Mock Geo Coordinates Enabled</div>
            </div>
        `;
    }
}

// Bind to window context for asynchronous API loading callback
window.initMap = initMap;
