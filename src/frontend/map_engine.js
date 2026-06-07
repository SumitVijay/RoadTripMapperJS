// src/frontend/map_engine.js

// Configuration parameters for smooth rendering
const FRAME_RATE = 24;
const INTERPOLATION_STEPS = 15; // Higher value = smoother camera panning

let routeLine = null;
let carMarker = null;

/**
 * Initializes and draws the global route history line onto the Leaflet canvas
 */
export function initializeRoute(map, coordinates) {
    // 1. Draw the global background faded route line
    L.polyline(coordinates, {
        color: '#34495e',
        weight: 3,
        opacity: 0.4,
        dashArray: '5, 10'
    }).addTo(map);

    // 2. Initialize the dynamic foreground "active driving" path line
    routeLine = L.polyline([], {
        color: '#00d2d3', // Premium neon cyan
        weight: 6,
        opacity: 0.95,
        lineCap: 'round'
    }).addTo(map);

carMarker = L.marker(coordinates[0], {
    icon: L.divIcon({
        className: 'custom-car-vehicle',
        html: `<div id="car-pointer" style="
            width: 24px; 
            height: 24px; 
            background: #ff2d55; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 0 15px #ff2d55;
            position: relative;
            transition: transform 0.1s linear;
        ">
            <div style="
                position: absolute; 
                top: -6px; 
                left: 6px; 
                width: 6px; 
                height: 6px; 
                background: #ffffff; 
                border-radius: 50%;
            "></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    zIndexOffset: 1000
}).addTo(map);
    
    console.log("🛣️ Route geometry vector paths loaded onto the Leaflet engine.");
}

/**
 * Updates the vehicle position, appends the path history, and pans the camera fluidly
 */
export function updateVehicleFrame(map, targetLat, targetLon) {
    const nextPoint = [targetLat, targetLon];
    
    // Append coordinate to the running path history line
    routeLine.addLatLng(nextPoint);
    
    // Move the vehicle dot asset
    carMarker.setLatLng(nextPoint);
    
    // Pan the map camera smoothly to keep the vehicle perfectly centered
    map.panTo(nextPoint, {
        animate: true,
        duration: 1 / FRAME_RATE,
        easeLinearity: 0.25
    });
}