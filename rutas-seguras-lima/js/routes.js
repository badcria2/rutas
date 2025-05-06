/**
 * routes.js
 * Maneja la funcionalidad relacionada con la búsqueda, cálculo y visualización
 * de rutas seguras en la aplicación Rutas Seguras Lima.
 */

// Importaciones (se implementaría con un sistema de módulos adecuado)
// En este momento usamos variables globales porque el código original no usa módulos

/**
 * Objeto que encapsula toda la funcionalidad de rutas
 */
const Routes = (function() {
    // Variables privadas
    let map;                  // Referencia al mapa (se inicializará desde map.js)
    let originMarker;         // Marcador para el punto de origen
    let destinationMarker;    // Marcador para el punto de destino
    let routeLayer;           // Capa que contiene la línea de la ruta

    /**
     * Inicializa el módulo de rutas con las dependencias necesarias
     * @param {Object} mapInstance - Instancia del mapa de Leaflet
     */
    function init(mapInstance) {
        map = mapInstance;
        console.log('Módulo de rutas inicializado');
    }

    /**
     * Busca y muestra una ruta segura entre dos puntos
     * @param {string} origin - Descripción del punto de origen
     * @param {string} destination - Descripción del punto de destino
     * @returns {Promise} - Promesa que se resuelve cuando la ruta se ha calculado y mostrado
     */
    function findSecureRoute(origin, destination) {
        // Mostrar indicador de carga
        UI.showLoading();
        
        return new Promise((resolve) => {
            // Simulamos un tiempo de carga para simular la consulta a la base de datos
            setTimeout(() => {
                // Obtener coordenadas a través de geocoding
                const originCoords = Data.mockGeocode(origin);
                const destCoords = Data.mockGeocode(destination);
                
                // Limpiar marcadores y rutas previas
                clearRouteDisplay();
                
                // Crear marcadores para origen y destino
                createRouteMarkers(origin, originCoords, destination, destCoords);
                
                // Generar una ruta "segura" simulada
                const route = generateRoute(originCoords, destCoords);
                
                // Dibujar la ruta en el mapa
                displayRoute(route);
                
                // Ajustar vista para ver la ruta completa
                map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
                
                // Actualizar información de la ruta en la UI
                UI.updateRouteInfo(route);
                
                // Ocultar indicador de carga
                UI.hideLoading();
                
                // Mostrar panel de información de ruta
                UI.showRouteInfo();
                
                resolve(route);
            }, 1500); // Simular tiempo de carga de 1.5 segundos
        });
    }

    /**
     * Limpia los marcadores y la línea de ruta del mapa
     */
    function clearRouteDisplay() {
        if (originMarker) map.removeLayer(originMarker);
        if (destinationMarker) map.removeLayer(destinationMarker);
        if (routeLayer) map.removeLayer(routeLayer);
    }

    /**
     * Crea los marcadores de origen y destino en el mapa
     * @param {string} originName - Nombre del origen
     * @param {Array} originCoords - Coordenadas del origen [lat, lng]
     * @param {string} destName - Nombre del destino
     * @param {Array} destCoords - Coordenadas del destino [lat, lng]
     */
    function createRouteMarkers(originName, originCoords, destName, destCoords) {
        originMarker = L.marker(originCoords).addTo(map);
        originMarker.bindPopup(`<b>Origen:</b> ${originName}`).openPopup();
        
        destinationMarker = L.marker(destCoords).addTo(map);
        destinationMarker.bindPopup(`<b>Destino:</b> ${destName}`);
    }

    /**
     * Genera una ruta entre dos puntos considerando factores de seguridad
     * @param {Array} origin - Coordenadas de origen [lat, lng]
     * @param {Array} destination - Coordenadas de destino [lat, lng]
     * @returns {Object} - Objeto con información de la ruta
     */
    function generateRoute(origin, destination) {
        // Generar puntos intermedios para simular una ruta
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
            distance += calculateDistance(path[i-1], path[i]);
        }
        
        // Calcular tiempo estimado (aproximadamente 4 km/h caminando)
        const timeMinutes = Math.round(distance / 4 * 60);
        
        // Calcular nivel de seguridad usando el módulo de seguridad
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

    /**
     * Muestra la ruta en el mapa
     * @param {Object} route - Objeto con información de la ruta
     */
    function displayRoute(route) {
        routeLayer = L.polyline(route.path, { 
            color: '#3498db', 
            weight: 5 
        }).addTo(map);
    }

    /**
     * Calcula la distancia aproximada entre dos puntos (en km)
     * usando la fórmula de Haversine
     * @param {Array} point1 - Coordenadas del punto 1 [lat, lng]
     * @param {Array} point2 - Coordenadas del punto 2 [lat, lng]
     * @returns {number} - Distancia en kilómetros
     */
    function calculateDistance(point1, point2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = deg2rad(point2[0] - point1[0]);
        const dLon = deg2rad(point2[1] - point1[1]);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(deg2rad(point1[0])) * Math.cos(deg2rad(point2[0])) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     * @param {number} deg - Grados
     * @returns {number} - Radianes
     */
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Exponer API pública
    return {
        init,
        findSecureRoute,
        calculateDistance  // Exposición para uso en otros módulos
    };
})();

// En un sistema real de módulos usaríamos:
// export default Routes;