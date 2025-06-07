/**
 * app.config.js
 * Configuración de la aplicación
 */

require('dotenv').config();

const config = {
    // Configuración de OpenRouteService
    openRouteService: {
        apiKey: process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf624800c75ecee995871d6444db4f917adebc41cc19a473cc7fe50f0a56c2',
        baseUrl: 'https://api.openrouteservice.org/v2'
    },
    
    // Otras configuraciones de la aplicación
    defaultLocation: {
        lat: -12.0464,
        lng: -77.0428
    },
    
    // Configuración para modos de transporte
    transportModes: {
        'driving-car': {
            nombre: 'Automóvil',
            velocidadPromedio: 40, // km/h
            velocidadMetrosPorSegundo: 11.11 // m/s
        },
        'foot-walking': {
            nombre: 'A pie',
            velocidadPromedio: 5, // km/h
            velocidadMetrosPorSegundo: 1.4 // m/s
        },
        'cycling-regular': {
            nombre: 'Bicicleta',
            velocidadPromedio: 15, // km/h
            velocidadMetrosPorSegundo: 4.17 // m/s
        }
    },
    
    // Parámetros para cálculo de seguridad
    seguridadFactores: {
        positivos: {
            comisaria: 5,
            serenazgo: 3,
            hospital: 2,
            iluminacion: 1
        },
        negativos: {
            robo: -8,
            acoso: -5,
            accidente: -3,
            otro: -2
        }
    },
    
    // Configuración para producción vs desarrollo
    env: process.env.NODE_ENV || 'development'
};

module.exports = config;