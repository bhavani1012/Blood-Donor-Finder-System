/**
 * Geolocation sync utility for Blood Donor Finder System.
 */
const LocationSync = {
    /**
     * Prompts the browser to capture precise current coordinates.
     * @param {function} successCallback - runs on successful coordinates grab
     * @param {function} errorCallback - runs on error/permission deny
     */
    getCurrentLocation: function(successCallback, errorCallback) {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your current browser.");
            if (errorCallback) errorCallback("Not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Cache coordinates locally in session storage
                sessionStorage.setItem('user_lat', lat);
                sessionStorage.setItem('user_lng', lng);

                if (successCallback) {
                    successCallback(lat, lng);
                }
            },
            (error) => {
                let errorMsg = "Unable to retrieve your location.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "Permission denied. Please grant location access in browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Location information is currently unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "The request to get your location timed out.";
                        break;
                }
                if (errorCallback) {
                    errorCallback(errorMsg);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    },

    /**
     * Posts captured coordinates to the backend API for Donor accounts.
     */
    syncDonorLocation: function() {
        const syncButton = document.getElementById('sync-location-btn');
        const mapContainer = document.getElementById('donor-map');
        if (syncButton && !mapContainer) {
            syncButton.addEventListener('click', () => {
                syncButton.disabled = true;
                syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching GPS...';
                
                this.getCurrentLocation(
                    (lat, lng) => {
                        // Send coordinates asynchronously to server
                        fetch('/api/v1/location/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken()
                            },
                            body: JSON.stringify({ latitude: lat, longitude: lng })
                        })
                        .then(response => response.json())
                        .then(data => {
                            syncButton.disabled = false;
                            syncButton.innerHTML = '<i class="fas fa-map-marker-alt"></i> Location Synced';
                            if (data.status === 'success') {
                                alert(data.message);
                                // Reload dashboard to update distances or listings
                                window.location.reload();
                            } else {
                                alert("Failed to save location: " + data.error);
                            }
                        })
                        .catch(err => {
                            syncButton.disabled = false;
                            syncButton.innerHTML = '<i class="fas fa-sync"></i> Try Again';
                            alert("API connection failed.");
                        });
                    },
                    (errorMsg) => {
                        syncButton.disabled = false;
                        syncButton.innerHTML = '<i class="fas fa-sync"></i> Try Again';
                        alert(errorMsg);
                    }
                );
            });
        }
    },

    /**
     * Retrieve CSRF token from HTML page headers
     */
    getCsrfToken: function() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
};

// Initialize listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
    LocationSync.syncDonorLocation();
    
    // Auto cache coordinates when recipient loads search page
    if (window.location.pathname.includes('/recipient/search')) {
        const urlParams = new URLSearchParams(window.location.search);
        // If coordinate parameters are missing from URL, redirect with cached coords
        if (!urlParams.has('lat') || !urlParams.has('lng')) {
            LocationSync.getCurrentLocation((lat, lng) => {
                urlParams.set('lat', lat);
                urlParams.set('lng', lng);
                window.location.search = urlParams.toString();
            });
        }
    }
});
