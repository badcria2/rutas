/**
 * map.js - Manejo del mapa y visualización geográfica
 */

// Variables globales del mapa
let map, originMarker, destinationMarker, routeLayer;

// Coordenadas y zoom por defecto (Lima)
const LIMA_CENTER = [-12.0464, -77.0428];
const DEFAULT_ZOOM = 12;

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
    addMapLegend();
    
    console.log('Mapa inicializado correctamente');
}

/**
 * Añade una leyenda al mapa
 */
function addMapLegend() {
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
 * Carga los puntos de seguridad e incidentes en el mapa
 * @param {Object} securityData - Datos de seguridad (puntos e incidentes)
 */
function loadSecurityPoints(securityData) {
    // Validar que tengamos datos de seguridad
    if (!securityData || !securityData.securityPoints || !securityData.incidents) {
        console.error('Datos de seguridad no disponibles para el mapa');
        return;
    }
    
    console.log('Cargando puntos de seguridad en el mapa:', securityData.securityPoints.data.length);
    console.log('Cargando incidentes en el mapa:', securityData.incidents.data.length);
    
    // Cargar puntos de seguridad
    securityData.securityPoints.data.forEach(point => {
        let markerColor;
        let markerIcon;
        
        // Determinar color según el nivel de seguridad
        switch (point.security_level) {
            case 'high':
                markerColor = '#27ae60';
                break;
            case 'medium':
                markerColor = '#f39c12';
                break;
            case 'low':
                markerColor = '#e74c3c';
                break;
            default:
                markerColor = '#3498db';
        }
        
        // Determinar icono según el tipo
        switch (point.type) {
            case 'police':
                markerIcon = '🚓';
                break;
            case 'commercial':
                markerIcon = '🏬';
                break;
            case 'park':
                markerIcon = '🌳';
                break;
            case 'risk':
                markerIcon = '⚠️';
                break;
            case 'monitored':
                markerIcon = '📹';
                break;
            case 'lighting':
                markerIcon = '💡';
                break;
            default:
                markerIcon = '📍';
        }
        
        // Crear marcador con popup
        const marker = L.marker([point.latitude, point.longitude]).addTo(map);
        
        marker.bindPopup(`
            <div class="marker-popup">
                <h3>${markerIcon} ${point.name}</h3>
                <p>Tipo: ${getPointTypeName(point.type)}</p>
                <p class="marker-security security-${point.securityLevel}">
                    Nivel de seguridad: ${getSecurityLevelName(point.securityLevel)}
                </p>
            </div>
        `);
    });
    
    // Cargar incidentes
    securityData.incidents.data.forEach(incident => {
        const marker = L.circle([incident.latitude, incident.longitude], {
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.5,
            radius: 150
        }).addTo(map);
        
        marker.bindPopup(`
            <div class="marker-popup">
                <h3>⚠️ ${incident.type}</h3>
                <p>${incident.description}</p>
                <p>Reportado: ${formatDate(incident.date)}</p>
            </div>
        `);
    });
}

/**
 * Obtiene el nombre del tipo de punto en formato legible
 * @param {string} type - Tipo de punto
 * @returns {string} Nombre formateado
 */
function getPointTypeName(type) {
    const types = {
        'police': 'Comisaría/Patrullaje',
        'commercial': 'Centro Comercial',
        'park': 'Parque/Área Verde',
        'risk': 'Zona de Riesgo',
        'monitored': 'Zona Monitoreada',
        'lighting': 'Zona Bien Iluminada'
    };
    
    return types[type] || type;
}

/**
 * Obtiene el nombre del nivel de seguridad en formato legible
 * @param {string} level - Nivel de seguridad
 * @returns {string} Nombre formateado
 */
function getSecurityLevelName(level) {
    const levels = {
        'high': 'Alta',
        'medium': 'Media',
        'low': 'Baja'
    };
    
    return levels[level] || level;
}

/**
 * Formatea una fecha a formato local
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE');
}

/**
 * Añade marcadores de origen y destino al mapa
 * @param {Array} origin - Coordenadas de origen [lat, lng]
 * @param {string} originName - Nombre del origen
 * @param {Array} destination - Coordenadas de destino [lat, lng]
 * @param {string} destinationName - Nombre del destino
 */
function addRouteMarkers(origin, originName, destination, destinationName) {
    // Limpiar marcadores previos
    if (originMarker) map.removeLayer(originMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routeLayer) map.removeLayer(routeLayer);
    
    // Añadir nuevos marcadores
    originMarker = L.marker(origin).addTo(map);
    originMarker.bindPopup(`<b>Origen:</b> ${originName}`).openPopup();
    
    destinationMarker = L.marker(destination).addTo(map);
    destinationMarker.bindPopup(`<b>Destino:</b> ${destinationName}`);
}

/**
 * Dibuja una ruta en el mapa
 * @param {Array} routePath - Array de puntos [lat, lng] que forman la ruta
 */
function drawRoute(routePath) {
    // Limpiar ruta previa
    if (routeLayer) map.removeLayer(routeLayer);
    
    // Añadir nueva ruta
    routeLayer = L.polyline(routePath, { color: '#3498db', weight: 5 }).addTo(map);
    
    // Ajustar vista para ver la ruta completa
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}