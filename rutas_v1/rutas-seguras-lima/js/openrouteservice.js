/**
 * openrouteservice-simple.js
 * Versión simplificada del módulo OpenRouteService para pruebas con solución CORS
 */

// Definición simplificada del módulo OpenRouteService
const OpenRouteService = (function() {
    // Variable para almacenar la API key
    let apiKey = "";
    
    // URL base para las peticiones a la API
    const baseUrl = "https://api.openrouteservice.org/v2";
    
    // URL de proxy CORS para desarrollo
    const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
    
    /**
     * Configura la API key para OpenRouteService
     * @param {string} key - API key para OpenRouteService
     */
    function setApiKey(key) {
        apiKey = key;
        console.log('API key de OpenRouteService configurada:', key ? '✓' : 'No configurada');
        return true;
    }
    
    /**
     * Verifica si OpenRouteService está disponible
     * @returns {boolean} - true si OpenRouteService está disponible
     */
    function isAvailable() {
        return true; // Siempre devuelve true para pruebas
    }
    
    /**
     * Crea una URL que evite problemas CORS para desarrollo local
     * @param {string} url - URL original
     * @returns {string} - URL con proxy CORS si es necesario
     */
    function getCorsUrl(url) {
        // Si estamos en un entorno local (sin host o localhost), usar el proxy CORS
        const isLocalDevelopment = window.location.hostname === '' || 
                                  window.location.hostname === 'localhost' || 
                                  window.location.hostname === '127.0.0.1' ||
                                  window.location.protocol === 'file:';
                                  
        if (isLocalDevelopment) {
            console.log('Usando proxy CORS para desarrollo local');
            return corsProxyUrl + url;
        }
        
        return url;
    }
    
    /**
     * Verificar conexión con OpenRouteService
     * @returns {Promise<boolean>} - Promise con true si la conexión es exitosa
     */
    async function testConnection() {
        try {
            if (!apiKey) {
                console.log('API key no configurada, simulando conexión exitosa');
                return true; // Para pruebas, simular que siempre hay conexión
            }
            
            console.log('Probando conexión con OpenRouteService...');
            
            // Versión simplificada: no hacer una solicitud real
            // Solo verificar si hay API key
            if (apiKey) {
                console.log('Conexión simulada exitosa con OpenRouteService');
                return true;
            } else {
                console.warn('No se pudo conectar con OpenRouteService (API key faltante)');
                return false;
            }
            
            /* Código original con CORS (comentado para evitar el error)
            const url = getCorsUrl(`${baseUrl}/health`);
            const response = await fetch(url, {
                headers: {
                    'Authorization': apiKey
                }
            });
            
            if (response.ok) {
                console.log('Conexión exitosa con OpenRouteService');
                return true;
            } else {
                console.warn(`OpenRouteService respondió con estado: ${response.status}`);
                return false;
            }
            */
        } catch (error) {
            console.error('Error de conexión con OpenRouteService:', error);
            return false;
        }
    }
    
    // Esta versión simplificada no hace peticiones reales
    function getRoute(start, end) {
        console.log('OpenRouteService: Generando ruta simulada');
        console.log('Desde:', start);
        console.log('Hasta:', end);
        
        // Devuelve una promesa con una ruta simulada
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generar puntos intermedios entre start y end
                const midPoints = generateMidPoints(start, end, 5);
                const path = [start, ...midPoints, end];
                
                // Crear objeto de ruta simulada
                const route = {
                    path: path,
                    distance: '1.5',
                    timeMinutes: 20,
                    securityLevel: 75,
                    nearbyIncidents: []
                };
                
                resolve(route);
            }, 500);
        });
    }
    
    /**
     * Genera puntos intermedios entre dos puntos
     * @param {Array} start - Punto de inicio [lat, lng]
     * @param {Array} end - Punto final [lat, lng]
     * @param {number} count - Número de puntos a generar
     * @returns {Array} - Array de puntos intermedios
     */
    function generateMidPoints(start, end, count) {
        const points = [];
        
        for (let i = 1; i <= count; i++) {
            const ratio = i / (count + 1);
            const lat = start[0] + (end[0] - start[0]) * ratio;
            const lng = start[1] + (end[1] - start[1]) * ratio;
            
            // Añadir pequeña variación para simular calles
            const latVar = (Math.random() - 0.5) * 0.01;
            const lngVar = (Math.random() - 0.5) * 0.01;
            
            points.push([lat + latVar, lng + lngVar]);
        }
        
        return points;
    }
    
    /**
     * Simula rutas alternativas
     */
    function getAlternativeRoutes(start, end) {
        console.log('OpenRouteService: Generando rutas alternativas simuladas');
        return new Promise((resolve) => {
            setTimeout(() => {
                const routes = [
                    {
                        path: [start, ...generateMidPoints(start, end, 5), end],
                        distance: '1.5',
                        timeMinutes: 20,
                        securityLevel: 75,
                        nearbyIncidents: []
                    },
                    {
                        path: [start, ...generateMidPoints(start, end, 4), end],
                        distance: '1.7',
                        timeMinutes: 22,
                        securityLevel: 65,
                        nearbyIncidents: []
                    },
                    {
                        path: [start, ...generateMidPoints(start, end, 6), end],
                        distance: '1.9',
                        timeMinutes: 24,
                        securityLevel: 60,
                        nearbyIncidents: []
                    }
                ];
                resolve(routes);
            }, 500);
        });
    }
    
    // Exponer API pública
    return {
        setApiKey,
        isAvailable,
        getRoute,
        getAlternativeRoutes,
        testConnection
    };
})();

// Registrar en el objeto global window
window.OpenRouteService = OpenRouteService;

console.log('Módulo OpenRouteService (versión simple con solución CORS) cargado correctamente');