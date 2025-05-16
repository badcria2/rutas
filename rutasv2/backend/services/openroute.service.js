/**
 * openroute.service.js
 * Servicio para interactuar con OpenRouteService API
 */

const axios = require('axios');
const appConfig = require('../config/app.config');

// Verificar que la configuración se ha cargado correctamente
if (!appConfig.openRouteService) {
    console.error('===============================================');
    console.error('ERROR: Configuración de OpenRouteService no encontrada.');
    console.error('Configuración cargada:', appConfig);
    console.error('===============================================');
    // Crear la configuración mínima necesaria para que el servicio funcione
    appConfig.openRouteService = {
        apiKey: process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf62485bae0162dc5e4090a9353097b62bb6ae',
        baseUrl: 'https://api.openrouteservice.org/v2'
    };
}

// Token de acceso a OpenRouteService
const ORS_API_KEY = process.env.OPENROUTE_API_KEY || appConfig.openRouteService.apiKey;
const ORS_BASE_URL = appConfig.openRouteService.baseUrl;

/**
 * Obtiene una ruta desde OpenRouteService
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Promise<Object>} - Datos de la ruta
 */
async function obtenerRuta(origen, destino, modo) {
    try {
        // Preparar las coordenadas para la petición
        // OpenRouteService usa [longitud, latitud] en lugar de [latitud, longitud]
        const coordinates = [
            [origen.lng, origen.lat],
            [destino.lng, destino.lat]
        ];
        
        // Configurar la petición
        const url = `${ORS_BASE_URL}/directions/${modo}`;
        const headers = {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const data = {
            coordinates,
            format: 'geojson', // Para obtener la geometría en formato GeoJSON
            instructions: true,
            language: 'es',
            units: 'km'
        };
        
        // Realizar la petición
        const response = await axios.post(url, data, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error al obtener ruta desde OpenRouteService:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        throw error;
    }
}

/**
 * Obtiene rutas alternativas desde OpenRouteService
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Promise<Object>} - Datos de las rutas alternativas
 */
async function obtenerRutasAlternativas(origen, destino, modo) {
    try {
        // Preparar las coordenadas para la petición
        const coordinates = [
            [origen.lng, origen.lat],
            [destino.lng, destino.lat]
        ];
        
        // Configurar la petición
        const url = `${ORS_BASE_URL}/directions/${modo}`;
        const headers = {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const data = {
            coordinates,
            format: 'geojson',
            instructions: true,
            language: 'es',
            units: 'km',
            alternative_routes: {
                target_count: 3,        // Cantidad de rutas alternativas
                weight_factor: 1.6,     // Factor de peso para las alternativas
                share_factor: 0.8       // Factor de compartición de segmentos
            }
        };
        
        // Realizar la petición
        const response = await axios.post(url, data, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error al obtener rutas alternativas desde OpenRouteService:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        throw error;
    }
}

/**
 * Verifica el estado de la API de OpenRouteService
 * @returns {Promise<boolean>} - true si la API está funcionando correctamente
 */
async function verificarEstatusAPI() {
    try {
        const url = `${ORS_BASE_URL}/status`;
        const headers = {
            'Authorization': ORS_API_KEY
        };
        
        const response = await axios.get(url, { headers });
        
        return response.status === 200;
    } catch (error) {
        console.error('Error al verificar estado de OpenRouteService:', error.message);
        return false;
    }
}

module.exports = {
    obtenerRuta,
    obtenerRutasAlternativas,
    verificarEstatusAPI
};