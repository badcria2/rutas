const geoUtils = require('../utils/geo.utils');
const routeUtils = require('../utils/route.utils');
const openRouteService = require('./openroute.service');
const db = require('../db/db');

/**
 * Formatea los puntos de seguridad e incidentes para la respuesta API
 * @param {Object} puntosCercanos - Objeto con arrays de puntos de seguridad e incidentes
 * @returns {Array} - Array formateado de puntos
 */
function formatearPuntosSeguridad(puntosCercanos) {
    return [
        ...puntosCercanos.puntosSeguridad.map(p => ({
            id: p.id,
            nombre: p.nombre,
            tipo: p.tipo,
            descripcion: p.descripcion,
            lat: p.lat,
            lng: p.lng,
            distancia: Math.round(p.distancia)
        })),
        ...puntosCercanos.incidentes.map(i => ({
            id: i.id,
            nombre: `Incidente: ${i.tipo}`,
            tipo: 'incidente',
            descripcion: i.descripcion,
            lat: i.lat,
            lng: i.lng,
            distancia: Math.round(i.distancia),
            fecha: i.fecha
        }))
    ];
}

/**
 * Crea una ruta simulada cuando hay problemas con la API
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Object} - Datos simulados de ruta
 */
function crearRutaSimulada(origen, destino, modo) {
    // Crear una ruta con múltiples puntos que simule calles reales
    const rutaGeometry = {
        type: "LineString",
        coordinates: routeUtils.generarCoordenadasRealistasParaRuta(origen, destino, modo)
    };
    
    // Calcular distancia de la ruta (sumando distancias entre puntos)
    const dist = geoUtils.calcularDistanciaRutaCompleta(rutaGeometry.coordinates);
    
    // Calcular tiempo según modo de transporte
    const velocidades = {
        'driving-car': 11.11, // 40 km/h en m/s
        'foot-walking': 1.4,  // 5 km/h en m/s
        'cycling-regular': 4.17 // 15 km/h en m/s
    };
    const velocidad = velocidades[modo] || velocidades['driving-car'];
    const tiempo = Math.round(dist / velocidad);
    
    // Crear datos de ruta simulados
    const rutaSimulada = {
        geometry: rutaGeometry,
        properties: {
            segments: [{
                distance: dist,
                duration: tiempo,
                steps: []
            }],
            summary: {
                distance: dist,
                duration: tiempo
            },
            way_points: [0, rutaGeometry.coordinates.length - 1]
        },
        seguridadScore: 65 + Math.floor(Math.random() * 20) // Entre 65-85
    };
    
    // Crear puntos de seguridad simulados
    const puntosSeguridadSimulados = routeUtils.generarPuntosSeguridadSimulados(rutaGeometry.coordinates);
    
    return {
        ruta: rutaSimulada,
        puntosSeguridad: puntosSeguridadSimulados
    };
}

/**
 * Obtiene una ruta visual entre dos puntos (real o simulada)
 * @param {Object} origen - Punto de origen {lat, lng}
 * @param {Object} destino - Punto de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Object} - Ruta para visualización con puntos de seguridad
 */
async function obtenerRutaVisual(origen, destino, modo) {
    // Intentar obtener una ruta desde OpenRouteService
    let rutaVisual;
    try {
        // Intentar obtener una ruta real
        const rutaData = await openRouteService.obtenerRuta(origen, destino, modo);
        if (rutaData && rutaData.routes && rutaData.routes.length > 0) {
            rutaVisual = prepararRutaVisual(rutaData.routes[0]);
        } else {
            throw new Error('No se pudo obtener una ruta válida de OpenRouteService');
        }
    } catch (error) {
        // Si falla, generar una ruta simulada para visualización
        console.log('Usando ruta simulada para visualización', error.message);
        rutaVisual = generarRutaVisualSimulada(origen, destino, modo);
    }
    
    // Obtener puntos de seguridad e incidentes cercanos a la ruta
    const coordenadas = rutaVisual.bounds;
    const puntosCercanos = await db.getPuntosEnRuta(coordenadas, 300);
    
    // Calcular índice de seguridad de la ruta
    const seguridadScore = await db.calcularIndiceSeguridad(coordenadas);
    
    // Formatear los puntos de seguridad para la respuesta
    const puntosSeguridad = formatearPuntosSeguridad(puntosCercanos);
    
    // Añadir el índice de seguridad a la ruta
    rutaVisual.seguridadScore = seguridadScore;
    
    // Devolver ruta y puntos de seguridad
    return {
        ruta: rutaVisual,
        puntosSeguridad
    };
}

/**
 * Prepara una ruta de OpenRouteService para visualización
 * @param {Object} ruta - Ruta obtenida de OpenRouteService
 * @returns {Object} - Ruta procesada para visualización
 */
function prepararRutaVisual(ruta) {
    // Extraer las coordenadas de la ruta
    const coordenadas = routeUtils.decodificarPolyline(ruta.geometry);

    // Extraer propiedades importantes
    const distancia = ruta.summary.distance;
    const duracion = ruta.summary.duration;
    
    // Devolver el objeto de ruta visual
    return {
        tipo: 'FeatureCollection',
        propiedades: {
            distancia: distancia,
            duracion: duracion
        },
        caracteristicas: [{
            tipo: 'Feature',
            geometria: {
                tipo: 'LineString',
                coordenadas: coordenadas
            }
        }],
        bounds: ruta.bbox
    };
}

/**
 * Genera una ruta visual simulada entre dos puntos
 * @param {Object} origen - Punto de origen {lat, lng}
 * @param {Object} destino - Punto de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Object} - Ruta simulada para visualización
 */
function generarRutaVisualSimulada(origen, destino, modo) {
    // Generar coordenadas intermedias realistas
    const coordenadas = routeUtils.generarCoordenadasNaturales(origen, destino, modo);
    
    // Calcular distancia aproximada
    const distancia = geoUtils.calcularDistanciaTotal(coordenadas.map(c => ({lat: c[1], lng: c[0]})));
    
    // Calcular duración aproximada según modo
    const velocidades = {
        'driving-car': 40, // km/h
        'foot-walking': 5,  // km/h
        'cycling-regular': 15 // km/h
    };
    const velocidad = velocidades[modo] || velocidades['driving-car'];
    const duracionHoras = distancia / 1000 / velocidad;
    const duracionSegundos = Math.round(duracionHoras * 3600);
    
    // Calcular bbox (límites) para la ruta
    const minLat = Math.min(origen.lat, destino.lat) - 0.005;
    const maxLat = Math.max(origen.lat, destino.lat) + 0.005;
    const minLng = Math.min(origen.lng, destino.lng) - 0.005;
    const maxLng = Math.max(origen.lng, destino.lng) + 0.005;
    
    // Devolver objeto de ruta simulada
    return {
        tipo: 'FeatureCollection',
        propiedades: {
            distancia: distancia,
            duracion: duracionSegundos
        },
        caracteristicas: [{
            tipo: 'Feature',
            geometria: {
                tipo: 'LineString',
                coordenadas: coordenadas
            }
        }],
        bounds: [minLng, minLat, maxLng, maxLat]
    };
}

module.exports = {
    formatearPuntosSeguridad,
    crearRutaSimulada,
    obtenerRutaVisual,
    prepararRutaVisual,
    generarRutaVisualSimulada
};