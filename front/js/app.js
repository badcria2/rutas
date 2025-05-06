// Variables globales
let map;
let routeControl;
let markers = [];

// Inicializar el mapa y componentes relacionados
function initMap() {
    // Centrar el mapa en Lima
    const lima = [-12.046374, -77.042793];

    map = L.map('map').setView(lima, 13);

    // Cargar capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Configurar listener para el botón de búsqueda
    document.getElementById("buscar-ruta").addEventListener("click", findSafeRoute);

    // Cargar puntos de seguridad
    loadSecurityPoints();
}

// Función para buscar una ruta segura
async function findSafeRoute() {
    try {
        clearMap();

        const origenText = document.getElementById("origen").value;
        const destinoText = document.getElementById("destino").value;

        const origin = await geocodeLocation(origenText);
        const destination = await geocodeLocation(destinoText);

        if (!origin || !destination) {
            alert("No se pudieron geolocalizar las direcciones.");
            return;
        }

        addMarker(origin, "Origen", "icons/origin.png");
        addMarker(destination, "Destino", "icons/destination.png");

        // Enviar solicitud al backend para obtener la ruta más segura
        const response = await fetch("/api/ruta-segura", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ origin, destination })
        });

        if (!response.ok) throw new Error("Error al obtener la ruta segura");

        const routeData = await response.json();

        displayRoute(routeData);
        displayRouteInfo(routeData);

    } catch (error) {
        console.error("Error:", error);
        alert("Error al calcular ruta segura.");
    }
}

// Geocodificar una dirección usando Nominatim
async function geocodeLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    }
    return null;
}

// Visualizar la ruta en el mapa
function displayRoute(routeData) {
    if (routeControl) map.removeControl(routeControl);

    const waypoints = [
        L.latLng(routeData.route.origin.lat, routeData.route.origin.lng),
        ...(routeData.route.waypoints || []).map(wp => L.latLng(wp.lat, wp.lng)),
        L.latLng(routeData.route.destination.lat, routeData.route.destination.lng)
    ];

    routeControl = L.Routing.control({
        waypoints,
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: false,
        show: false
    }).addTo(map);

    routeControl.on('routesfound', function (e) {
        const steps = e.routes[0].coordinates;

        for (let i = 0; i < steps.length - 1; i++) {
            const level = routeData.segments[i]?.level || 'medium';
            let color = '#f39c12'; // default yellow
            if (level === 'high') color = '#2ecc71';
            if (level === 'low') color = '#e74c3c';

            L.polyline([steps[i], steps[i + 1]], {
                color,
                weight: 5,
                opacity: 0.7
            }).addTo(map);
        }
    });
}

// Mostrar información de la ruta
function displayRouteInfo(routeData) {
    const routeInfoElement = document.getElementById("route-info");
    const safetyLevels = routeData.segments.map(segment => segment.level);
    const highCount = safetyLevels.filter(level => level === "high").length;
    const mediumCount = safetyLevels.filter(level => level === "medium").length;
    const lowCount = safetyLevels.filter(level => level === "low").length;
    const totalSegments = safetyLevels.length;
    const safetyScore = (highCount * 3 + mediumCount * 2 + lowCount) / (totalSegments * 3) * 100;

    let html = `
        <h3>Información de la Ruta</h3>
        <p><strong>Distancia:</strong> ${routeData.distance} km</p>
        <p><strong>Tiempo estimado:</strong> ${routeData.duration} minutos</p>
        <p><strong>Índice de seguridad:</strong> ${safetyScore.toFixed(1)}%</p>
        <div class="safety-breakdown">
            <p>Segmentos de alta seguridad: ${highCount}</p>
            <p>Segmentos de media seguridad: ${mediumCount}</p>
            <p>Segmentos de baja seguridad: ${lowCount}</p>
        </div>
        <p class="safety-tips"><strong>Recomendaciones:</strong> ${routeData.tips || "No hay recomendaciones específicas."}</p>
    `;

    routeInfoElement.innerHTML = html;
    routeInfoElement.classList.add("visible");
}

// Cargar puntos de seguridad desde el backend
async function loadSecurityPoints() {
    try {
        const response = await fetch("/api/puntos-seguridad");
        if (!response.ok) throw new Error("Error al cargar puntos de seguridad");

        const points = await response.json();

        points.forEach(point => {
            let iconUrl = "icons/security-point.png";
            if (point.tipo === "comisaria") iconUrl = "icons/police.png";
            if (point.tipo === "serenazgo") iconUrl = "icons/security.png";

            addMarker({ lat: point.ubicacion.lat, lng: point.ubicacion.lng }, point.nombre, iconUrl);
        });
    } catch (error) {
        console.error("Error al cargar puntos de seguridad:", error);
    }
}

// Añadir marcador al mapa
function addMarker(position, title, iconUrl) {
    const marker = L.marker([position.lat, position.lng], {
        icon: L.icon({
            iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        })
    }).addTo(map).bindPopup(`<strong>${title}</strong>`);

    markers.push(marker);
}

// Limpiar marcadores y rutas
function clearMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    if (routeControl) map.removeControl(routeControl);
}

// Iniciar
window.onload = initMap;
