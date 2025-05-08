/**
 * config.js - Configuración global para la aplicación Rutas Seguras Lima
 */

// Definir configuración como objeto global
window.APP_CONFIG = {
    // Coordenadas centrales de Lima
    LIMA_CENTER: [-12.0464, -77.0428],
    DEFAULT_ZOOM: 13,
    // Configuración para OpenRouteService
    ORS_API_URL: 'https://api.openrouteservice.org/v2/directions',
    ORS_API_KEY: '5b3ce3597851110001cf6248f34f8959dc9440d2a4666f9d4b8bf120', // Clave API de ejemplo
    ORS_PROFILE: 'foot-walking' // Perfil de enrutamiento: peatonal
};

console.log('Configuración de la aplicación cargada correctamente');