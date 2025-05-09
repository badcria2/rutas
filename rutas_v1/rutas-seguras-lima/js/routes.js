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
const Routes = (function () {
    // Variables privadas
    let map;                  // Referencia al mapa (se inicializará desde map.js)
    let originMarker;         // Marcador para el punto de origen
    let destinationMarker;    // Marcador para el punto de destino
    let routeLayer;           // Capa que contiene la línea de la ruta
    let alternativeRouteLayers = []; // Capas para rutas alternativas
    let currentRoute = null;  // Ruta actual seleccionada
    let useOpenRouteService = true; // Flag para usar OpenRouteService o ruta simulada

    /**
 * Inicializa el módulo de rutas con las dependencias necesarias
 * @param {Object} mapInstance - Instancia del mapa de Leaflet
 */
    function init(mapInstance) {
        map = mapInstance;
        console.log('Módulo de rutas inicializado');

        // Verificar si OpenRouteService está disponible
        if (typeof OpenRouteService !== 'undefined') {
            console.log('OpenRouteService detectado. Se usará para calcular rutas reales.');

            // Establecer API key (si está en la configuración)
            if (typeof App !== 'undefined' && App.getConfig && App.getConfig().ORS_API_KEY) {
                OpenRouteService.setApiKey(App.getConfig().ORS_API_KEY);
            } else {
                console.warn('No se encontró API key para OpenRouteService en la configuración.');
                console.log('Por favor, configura una API key usando OpenRouteService.setApiKey()');
            }
        } else {
            console.warn('OpenRouteService no detectado. Se usarán rutas simuladas.');
            useOpenRouteService = false;
        }
    }

    /**
     * Establece si se debe usar OpenRouteService para calcular rutas
     * @param {boolean} use - true para usar OpenRouteService, false para usar rutas simuladas
     */
    function setUseOpenRouteService(use) {
        useOpenRouteService = use;
        console.log(`Uso de OpenRouteService ${use ? 'activado' : 'desactivado'}`);
    }

    /**
     * Busca y muestra una ruta segura entre dos puntos
     * @param {string} origin - Descripción del punto de origen
     * @param {string} destination - Descripción del punto de destino
     * @param {Object} options - Opciones adicionales para la ruta
     * @returns {Promise} - Promesa que se resuelve cuando la ruta se ha calculado y mostrado
     */
    function findSecureRoute(origin, destination, options = {}) {
        // Mostrar indicador de carga
        if (typeof UI !== 'undefined' && UI.showLoading) {
            UI.showLoading();
        }
        
        return new Promise(async (resolve, reject) => {
            try {
                // Obtener coordenadas a través de geocoding
                // Usar mockGeocode interno en lugar de Data.mockGeocode
                const originCoords = mockGeocode(origin);
                const destCoords = mockGeocode(destination);
                
                // Limpiar marcadores y rutas previas
                clearRouteDisplay();
                
                // Crear marcadores para origen y destino
                createRouteMarkers(origin, originCoords, destination, destCoords);
                
                let route;
                
                // Determinar si usar OpenRouteService o ruta simulada
                if (useOpenRouteService && typeof OpenRouteService !== 'undefined') {
                    try {
                        // Intentar obtener la ruta usando OpenRouteService
                        if (options.showAlternatives) {
                            // Si se solicitan rutas alternativas
                            const routes = await OpenRouteService.getAlternativeRoutes(
                                originCoords, 
                                destCoords, 
                                { 
                                    profile: options.profile || 'foot-walking',
                                    alternatives: options.alternativesCount || 2
                                }
                            );
                            
                            // Mostrar todas las rutas alternativas
                            displayAlternativeRoutes(routes);
                            
                            // Usar la primera ruta como la principal
                            route = routes[0];
                        } else {
                            // Obtener una sola ruta
                            route = await OpenRouteService.getRoute(
                                originCoords, 
                                destCoords,
                                options.profile || 'foot-walking'
                            );
                            
                            // Dibujar la ruta en el mapa
                            displayRoute(route);
                        }
                    } catch (error) {
                        console.error('Error al obtener ruta con OpenRouteService:', error);
                        
                        // Si hay error con OpenRouteService, caer de nuevo en el método simulado
                        console.log('Usando método de ruta simulada como fallback');
                        route = generateRoute(originCoords, destCoords);
                        displayRoute(route);
                    }
                } else {
                    // Generar una ruta "segura" simulada
                    route = generateRoute(originCoords, destCoords);
                    
                    // Dibujar la ruta en el mapa
                    displayRoute(route);
                }
                
                // ... resto del código ...
                
                resolve(route);
            } catch (error) {
                console.error('Error al buscar ruta segura:', error);
                reject(error);
            }
        });
    }
    /**
     * Limpia los marcadores y la línea de ruta del mapa
     */
    function clearRouteDisplay() {
        if (originMarker) map.removeLayer(originMarker);
        if (destinationMarker) map.removeLayer(destinationMarker);
        if (routeLayer) map.removeLayer(routeLayer);

        // Limpiar rutas alternativas
        alternativeRouteLayers.forEach(layer => {
            if (layer) map.removeLayer(layer);
        });
        alternativeRouteLayers = [];
    }

    /**
     * Crea los marcadores de origen y destino en el mapa
     * @param {string} originName - Nombre del origen
     * @param {Array} originCoords - Coordenadas del origen [lat, lng]
     * @param {string} destName - Nombre del destino
     * @param {Array} destCoords - Coordenadas del destino [lat, lng]
     */
    function createRouteMarkers(originName, originCoords, destName, destCoords) {
        // Crear ícono de origen con estilo personalizado
        const originIcon = L.divIcon({
            className: 'custom-marker origin-marker',
            html: '<i class="fa fa-map-marker"></i>',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        // Crear ícono de destino con estilo personalizado
        const destIcon = L.divIcon({
            className: 'custom-marker destination-marker',
            html: '<i class="fa fa-flag-checkered"></i>',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        // Si no están disponibles los íconos de Font Awesome, usar íconos predeterminados
        originMarker = L.marker(originCoords).addTo(map);
        originMarker.bindPopup(`<b>Origen:</b> ${originName}`).openPopup();

        destinationMarker = L.marker(destCoords).addTo(map);
        destinationMarker.bindPopup(`<b>Destino:</b> ${destName}`);
    }

    /**
     * Genera una ruta entre dos puntos considerando factores de seguridad
     * (Versión simulada para cuando OpenRouteService no está disponible)
     * @param {Array} origin - Coordenadas de origen [lat, lng]
     * @param {Array} destination - Coordenadas de destino [lat, lng]
     * @returns {Object} - Objeto con información de la ruta
     */
    function generateRoute(origin, destination) {
        // Generar puntos intermedios para simular una ruta
        const numPoints = Math.floor(Math.random() * 5) + 8; // 8-12 puntos intermedios para más detalle
        const intermediatePoints = [];

        for (let i = 0; i < numPoints; i++) {
            const ratio = (i + 1) / (numPoints + 1);
            const lat = origin[0] + (destination[0] - origin[0]) * ratio;
            const lng = origin[1] + (destination[1] - origin[1]) * ratio;

            // Añadir variaciones más naturales para simular el seguimiento de calles
            // Las curvas son más pronunciadas en las secciones medias de la ruta
            const curveIntensity = Math.sin(ratio * Math.PI) * 0.03; // Mayor variación
            const latVariation = (Math.random() - 0.5) * curveIntensity;
            const lngVariation = (Math.random() - 0.5) * curveIntensity;

            intermediatePoints.push([lat + latVariation, lng + lngVariation]);
        }

        // Construir el camino completo
        const path = [origin, ...intermediatePoints, destination];

        // Refinar la ruta para que parezca más natural
        const refinedPath = refineRouteShape(path);

        // Calcular distancia aproximada (en km)
        let distance = 0;
        for (let i = 1; i < refinedPath.length; i++) {
            distance += calculateDistance(refinedPath[i - 1], refinedPath[i]);
        }

        // Calcular tiempo estimado (aproximadamente 4 km/h caminando)
        const timeMinutes = Math.round(distance / 4 * 60);

        // Calcular nivel de seguridad usando el módulo de seguridad
        const securityLevel = typeof Security !== 'undefined' ?
            Security.calculateRouteSecurityLevel(refinedPath) :
            Math.floor(Math.random() * 30) + 60; // Valor aleatorio entre 60-90

        // Encontrar incidentes cercanos a la ruta
        const nearbyIncidents = typeof Security !== 'undefined' ?
            Security.findNearbyIncidents(refinedPath) :
            [];

        return {
            path: refinedPath,
            distance: distance.toFixed(1),
            timeMinutes,
            securityLevel,
            nearbyIncidents
        };
    }
/**
 * Función de geocoding simulada (incluida directamente en routes.js)
 * @param {string} placeName - Nombre del lugar a geocodificar
 * @returns {Array} - Coordenadas [lat, lng]
 */
function mockGeocode(placeName) {
    // Crear un mapa de lugares conocidos
    const placeCoordinates = {
        'miraflores': [-12.1197, -77.0382],
        'san isidro': [-12.0970, -77.0507],
        'barranco': [-12.1492, -77.0120],
        'san borja': [-12.1069, -76.9996],
        'surco': [-12.1364, -76.9933],
        'la molina': [-12.0849, -76.9336],
        'lima': [-12.0464, -77.0428], // Centro de Lima
        'callao': [-12.0611, -77.1370],
        'plaza de armas': [-12.0456, -77.0302],
        'parque kennedy': [-12.1219, -77.0297],
        'larcomar': [-12.1317, -77.0307],
        'jockey plaza': [-12.0857, -76.9747],
        'aeropuerto': [-12.0219, -77.1143],
        'san miguel': [-12.0769, -77.0904],
        'magdalena': [-12.0925, -77.0704]
    };
    
    // Coordenadas por defecto (centro de Lima)
    const defaultCoords = [-12.0464, -77.0428]; 
    
    if (!placeName) return defaultCoords;
    
    // Normalizar el nombre (minúsculas, sin tildes)
    const normalizedName = placeName.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    
    // Buscar coincidencias parciales
    for (const [key, coords] of Object.entries(placeCoordinates)) {
        if (normalizedName.includes(key)) {
            console.log(`Geocoding: "${placeName}" => ${coords}`);
            return coords;
        }
    }
    
    // Si no hay coincidencia, devolver coordenadas aleatorias cerca del centro de Lima
    const randomLat = defaultCoords[0] + (Math.random() - 0.5) * 0.05;
    const randomLng = defaultCoords[1] + (Math.random() - 0.5) * 0.05;
    
    console.log(`Geocoding (random): "${placeName}" => [${randomLat.toFixed(6)}, ${randomLng.toFixed(6)}]`);
    return [randomLat, randomLng];
}
    /**
     * Refina la forma de la ruta para hacerla más natural y que parezca
     * que sigue calles reales
     * @param {Array} path - Array de puntos [lat, lng] de la ruta original
     * @returns {Array} - Array de puntos refinado
     */
    function refineRouteShape(path) {
        if (path.length < 3) return path;

        const refinedPath = [path[0]]; // Iniciar con el punto de origen

        // Para cada segmento de la ruta (excepto el último)
        for (let i = 0; i < path.length - 2; i++) {
            const current = path[i];
            const next = path[i + 1];
            const afterNext = path[i + 2];

            // Añadir el punto intermedio original
            refinedPath.push(next);

            // Calcular un punto de "esquina" para simular giros en calles
            // Solo para algunos segmentos (aleatorio)
            if (Math.random() > 0.3) {
                // Calcular punto medio entre este segmento y el siguiente
                const midLat = (next[0] + afterNext[0]) / 2;
                const midLng = (next[1] + afterNext[1]) / 2;

                // Determinar si el giro es en 90 grados (simular esquina)
                if (Math.random() > 0.7) {
                    // Crear una "esquina" más abrupta
                    // Primero horizontal, luego vertical (o viceversa)
                    const cornerPoint = Math.random() > 0.5
                        ? [next[0], midLng] // Cambio horizontal
                        : [midLat, next[1]]; // Cambio vertical

                    refinedPath.push(cornerPoint);
                }
            }
        }

        // Añadir el último punto (destino)
        refinedPath.push(path[path.length - 1]);

        return refinedPath;
    }

    /**
     * Muestra la ruta en el mapa
     * @param {Object} route - Objeto con información de la ruta
     */
    function displayRoute(route) {
        try {
            // Verificación de datos
            if (!route || !route.path || !Array.isArray(route.path) || route.path.length < 2) {
                console.error('Datos de ruta inválidos:', route);
                return;
            }
    
            // Verificar que map esté disponible
            if (!map) {
                console.error('Mapa no inicializado');
                return;
            }
    
            // Limpiar ruta previa si existe
            if (routeLayer && map.removeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
    
            // Registrar para depuración
            console.log('Dibujando ruta con', route.path.length, 'puntos:', route.path);
    
            // Estilos para la ruta principal
            const routeStyle = { 
                color: '#3498db', 
                weight: 5,
                opacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
            };
            
            // Asegurarse de que todos los puntos sean válidos
            const validPath = route.path.filter(point => {
                return Array.isArray(point) && point.length === 2 && 
                       !isNaN(point[0]) && !isNaN(point[1]);
            });
    
            if (validPath.length < 2) {
                console.error('No hay suficientes puntos válidos para dibujar la ruta');
                return;
            }
    
            // Crear la capa de la ruta con Leaflet
            routeLayer = L.polyline(validPath, routeStyle);
            
            // Añadir al mapa
            routeLayer.addTo(map);
            
            // Ajustar la vista para mostrar toda la ruta
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
            
            // Añadir animación a la ruta (efecto de "dibujo" de la ruta)
            if (typeof L.Polyline.SnakeAnim !== 'undefined') {
                console.log('Animando ruta con SnakeAnim');
                routeLayer.snakeIn();
            } else {
                console.log('L.Polyline.SnakeAnim no está disponible, no se animará la ruta');
            }
    
            console.log('Ruta dibujada correctamente');
        } catch (error) {
            console.error('Error al dibujar la ruta:', error);
        }
    }

    /**
     * Muestra rutas alternativas en el mapa
     * @param {Array} routes - Array de objetos de ruta
     */
    function displayAlternativeRoutes(routes) {
        if (!routes || !routes.length) return;

        // Estilos para las rutas alternativas
        const styles = [
            { color: '#3498db', weight: 5, opacity: 0.8 }, // Azul (principal)
            { color: '#27ae60', weight: 4, opacity: 0.7, dashArray: '10, 10' }, // Verde (alternativa 1)
            { color: '#e67e22', weight: 4, opacity: 0.7, dashArray: '5, 10' }   // Naranja (alternativa 2)
        ];

        // Mostrar cada ruta con su propio estilo
        routes.forEach((route, index) => {
            const style = styles[index] || {
                color: '#95a5a6',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 5'
            };

            // Si es la ruta principal (index 0)
            if (index === 0) {
                routeLayer = L.polyline(route.path, style).addTo(map);
                animateRoute(routeLayer);
            } else {
                // Es una ruta alternativa
                const altLayer = L.polyline(route.path, style).addTo(map);
                alternativeRouteLayers.push(altLayer);
            }
        });
    }

    /**
     * Anima la ruta para dar el efecto de "dibujo" progresivo
     * @param {Object} polyline - Objeto polyline de Leaflet a animar
     */
    function animateRoute(polyline) {
        // Si Leaflet Polyline.SnakeAnim está disponible, usarlo para animar
        if (L.Polyline.SnakeAnim) {
            polyline.snakeIn();
        }
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
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(point1[0])) * Math.cos(deg2rad(point2[0])) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     * @param {number} deg - Grados
     * @returns {number} - Radianes
     */
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    /**
     * Obtiene la ruta actual
     * @returns {Object} - Objeto con información de la ruta actual
     */
    function getCurrentRoute() {
        return currentRoute;
    }

    // Exponer API pública
    return {
        init,
        findSecureRoute,
        calculateDistance,
        getCurrentRoute,
        setUseOpenRouteService,
        clearRouteDisplay,
        displayRoute
    };
})();

// En un sistema real de módulos usaríamos:
// export default Routes;

// Al final de routes.js (después del patrón revelador)
if (typeof window !== 'undefined') {
    window.Routes = Routes;
}