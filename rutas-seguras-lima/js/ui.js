/**
 * ui.js - Funciones de interfaz de usuario para Rutas Seguras Lima
 */
 
/**
 * Inicializa el mapa cuando la página está cargada
 */
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    loadSecurityPoints();
});

/**
 * Inicializa el mapa de Leaflet
 */
function initMap() {
  
    // Crear el mapa y configurar la vista

    map = L.map('map').setView(LIMA_CENTER, DEFAULT_ZOOM);
    
    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Añadir leyenda al mapa
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <h4>Leyenda</h4>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #27ae60;"></div>
                <span>Alta seguridad</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #f39c12;"></div>
                <span>Seguridad media</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e74c3c;"></div>
                <span>Baja seguridad</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #3498db;"></div>
                <span>Ruta recomendada</span>
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
}

/**
 * Configura los event listeners para la interacción de usuario
 */
function setupEventListeners() {
    // Evento para el formulario de búsqueda de ruta
    document.getElementById('route-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        
        if (origin && destination) {
            findSecureRoute(origin, destination);
        }
    });
}

/**
 * Actualiza la información de la ruta en el panel lateral
 * @param {Object} route - Objeto con la información de la ruta
 */
function updateRouteInfo(route) {
    // Actualizar la información de la ruta en el panel lateral
    document.getElementById('route-distance').textContent = route.distance;
    document.getElementById('route-time').textContent = route.timeMinutes;
    
    // Actualizar el nivel de seguridad
    const securityFill = document.getElementById('security-level-fill');
    const securityPercentage = document.getElementById('security-percentage');
    
    securityFill.style.width = `${route.securityLevel}%`;
    securityPercentage.textContent = `${route.securityLevel}%`;
    
    // Establecer el color según el nivel de seguridad
    if (route.securityLevel >= 70) {
        securityFill.style.backgroundColor = '#27ae60'; // Verde para alta seguridad
    } else if (route.securityLevel >= 50) {
        securityFill.style.backgroundColor = '#f39c12'; // Amarillo para seguridad media
    } else {
        securityFill.style.backgroundColor = '#e74c3c'; // Rojo para baja seguridad
    }
    
    // Mostrar incidentes cercanos
    const incidentList = document.getElementById('incident-list');
    incidentList.innerHTML = '';
    
    if (route.nearbyIncidents.length === 0) {
        incidentList.innerHTML = '<div class="incident-item">No se encontraron incidentes cercanos</div>';
    } else {
        route.nearbyIncidents.forEach(incident => {
            const incidentItem = document.createElement('div');
            incidentItem.className = 'incident-item';
            incidentItem.innerHTML = `
                <strong>${incident.type}:</strong> ${incident.description} 
                <span style="color: #777;">(${formatDate(incident.date)})</span>
            `;
            incidentList.appendChild(incidentItem);
        });
    }
}
function findSecureRoute(origin, destination) {
    // Mostrar indicador de carga
    document.getElementById('loading').style.display = 'block';
    
    // Simulamos un tiempo de carga para simular la consulta a la base de datos
    setTimeout(() => {
        // Función que simula el geocoding para obtener coordenadas
        const originCoords = mockGeocode(origin);
        const destCoords = mockGeocode(destination);
        
        // Limpiar marcadores y rutas previas
        if (originMarker) map.removeLayer(originMarker);
        if (destinationMarker) map.removeLayer(destinationMarker);
        if (routeLayer) map.removeLayer(routeLayer);
        
        // Crear marcadores para origen y destino
        originMarker = L.marker(originCoords).addTo(map);
        originMarker.bindPopup(`<b>Origen:</b> ${origin}`).openPopup();
        
        destinationMarker = L.marker(destCoords).addTo(map);
        destinationMarker.bindPopup(`<b>Destino:</b> ${destination}`);
        
        // Generar una ruta "segura" simulada
        const route = generateMockRoute(originCoords, destCoords);
        
        // Dibujar la ruta en el mapa
        routeLayer = L.polyline(route.path, { color: '#3498db', weight: 5 }).addTo(map);
        
        // Ajustar vista para ver la ruta completa
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
        
        // Actualizar información de la ruta
        updateRouteInfo(route);
        
        // Ocultar indicador de carga
        document.getElementById('loading').style.display = 'none';
        
        // Mostrar panel de información de ruta
        document.getElementById('route-info').style.display = 'block';
    }, 1500); // Simular tiempo de carga de 1.5 segundos
}
function mockGeocode(placeName) {
    // Esta función simula el proceso de geocodificación
    // En una aplicación real, esto se haría con una API de geocodificación
    
    // Mapa simulado de lugares a coordenadas
   
    
    // Buscar el lugar ignorando mayúsculas/minúsculas
    const normalizedPlaceName = placeName.toLowerCase();
    
    // Verificar si el lugar existe en nuestro mapa simulado
    for (const [key, coords] of Object.entries(placeCoordinates)) {
        if (normalizedPlaceName.includes(key)) {
            return coords;
        }
    }
    
    // Si no se encuentra, devolver una coordenada aleatoria en Lima
    return [
        LIMA_CENTER[0] + (Math.random() - 0.5) * 0.1,
        LIMA_CENTER[1] + (Math.random() - 0.5) * 0.1
    ];
}
function generateMockRoute(origin, destination) {
    // Esta función simula la generación de una ruta "segura"
    // En una aplicación real, esto se haría con un algoritmo que considere
    // los datos de seguridad almacenados en PostgreSQL
    
    // Genere puntos intermedios para simular una ruta
    const numPoints = Math.floor(Math.random() * 3) + 3; // 3-5 puntos intermedios
    const intermediatePoints = [];
    
    for (let i = 0; i < numPoints; i++) {
        const ratio = (i + 1) / (numPoints + 1);
        const lat = origin[0] + (destination[0] - origin[0]) * ratio;
        const lng = origin[1] + (destination[1] - origin[1]) * ratio;
        
        // Añadir un poco de variación para que no sea una línea recta
        const latVariation = (Math.random() - 0.5) * 0.015;
        const lngVariation = (Math.random() - 0.5) * 0.015;
        
        intermediatePoints.push([lat + latVariation, lng + lngVariation]);
    }
    
    // Construir el camino completo
    const path = [origin, ...intermediatePoints, destination];
    
    // Calcular distancia aproximada (en km)
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
        distance += Routes.calculateDistance(path[i-1], path[i]);
    }
    
    // Calcular tiempo estimado (aproximadamente 4 km/h caminando)
    const timeMinutes = Math.round(distance / 4 * 60);
    
    // Calcular nivel de seguridad
    const securityLevel = Security.calculateRouteSecurityLevel(path);
    
    // Encontrar incidentes cercanos a la ruta
    const nearbyIncidents = Security.findNearbyIncidents(path);
    
    return {
        path,
        distance: distance.toFixed(1),
        timeMinutes,
        securityLevel,
        nearbyIncidents
    };
}
