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
            contacto: p.contacto,
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
 * Calcula los bounds (límites) para un array de coordenadas
 * @param {Array} coordinates - Array de coordenadas [lng, lat]
 * @returns {Array} - Bounds en formato [minLng, minLat, maxLng, maxLat]
 */
function calcularBounds(coordinates) {
    if (!coordinates || coordinates.length === 0) {
        return [0, 0, 0, 0];
    }
    
    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];
    
    coordinates.forEach(coord => {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
    });
    
    return [minLng, minLat, maxLng, maxLat];
}

/**
 * Decodifica un polyline string a coordenadas [lng, lat]
 * Basado en el algoritmo de Google Polyline
 * @param {string} encoded - String polyline codificado
 * @returns {Array} - Array de coordenadas [[lng, lat], [lng, lat], ...]
 */
function decodificarPolyline(encoded) {
    if (!encoded || typeof encoded !== 'string') {
        console.error('Polyline inválido:', encoded);
        return [];
    }
    
    console.log('🔓 Decodificando polyline de', encoded.length, 'caracteres');
    
    const coords = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        
        // Decodificar latitud
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        
        shift = 0;
        result = 0;
        
        // Decodificar longitud
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        
        // Convertir a coordenadas decimales y agregar al array
        // OpenRouteService usa precisión de 5 decimales
        coords.push([lng / 100000.0, lat / 100000.0]);
    }
    
    console.log('✅ Polyline decodificado:', coords.length, 'coordenadas');
    console.log('Primeras 3 coordenadas:', coords.slice(0, 3));
    
    return coords;
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
 * Prepara una ruta de OpenRouteService para visualización
 * VERSIÓN CORREGIDA que maneja polylines codificados
 * @param {Object} ruta - Ruta obtenida del servicio
 * @returns {Object} - Ruta procesada para visualización en formato consistente
 */
function prepararRutaVisual(ruta) {
    console.log('=== PREPARANDO RUTA VISUAL ===');
    console.log('Estructura de ruta recibida:', Object.keys(ruta));
    console.log('Tipo de geometría:', typeof ruta.geometry);
    
    let coordenadas;
    
    // Manejar diferentes formatos de geometry
    if (typeof ruta.geometry === 'string') {
        console.log('🔓 Geometry es string codificado - decodificando...');
        coordenadas = decodificarPolyline(ruta.geometry);
    } else if (ruta.geometry?.coordinates) {
        console.log('✅ Geometry ya tiene coordenadas decodificadas');
        coordenadas = ruta.geometry.coordinates;
    } else {
        console.error('❌ Formato de geometry desconocido:', ruta.geometry);
        throw new Error('Formato de geometry inválido');
    }
    
    // Verificar que las coordenadas existen y son válidas
    if (!coordenadas || !Array.isArray(coordenadas) || coordenadas.length === 0) {
        console.error('❌ Coordenadas de ruta inválidas:', coordenadas);
        throw new Error('Coordenadas de ruta inválidas');
    }
    
    console.log('✅ Coordenadas válidas encontradas:', coordenadas.length);
    console.log('Primeras 3 coordenadas:', coordenadas.slice(0, 3));
    
    // Extraer propiedades importantes
    const distancia = ruta.summary?.distance || 0;
    const duracion = ruta.summary?.duration || 0;
    
    console.log('Distancia:', distancia, 'km');
    console.log('Duración:', duracion, 'segundos');
    
    // Calcular bounds si no están disponibles
    const bounds = ruta.bbox || calcularBounds(coordenadas);
    console.log('Bounds calculados:', bounds);
    
    // Crear el objeto de ruta visual en formato consistente
    const rutaVisual = {
        // Formato para el frontend (caracteristicas)
        caracteristicas: [{
            tipo: 'Feature',
            geometria: {
                tipo: 'LineString',
                coordenadas: coordenadas // [lng, lat] formato del servicio
            }
        }],
        propiedades: {
            distancia: distancia * 1000, // Convertir de km a metros
            duracion: duracion
        },
        bounds: bounds,
        // También incluir el formato original para compatibilidad
        geometry: {
            type: 'LineString',
            coordinates: coordenadas
        },
        summary: {
            distance: distancia * 1000, // Convertir de km a metros
            duration: duracion
        }
    };
    
    console.log('✅ Ruta visual preparada exitosamente');
    console.log('Coordenadas en caracteristicas:', rutaVisual.caracteristicas[0].geometria.coordenadas.length);
    
    return rutaVisual;
}

/**
 * Obtiene una ruta visual entre dos puntos (real o simulada)
 * VERSIÓN CORREGIDA con decodificación de polyline
 */
async function obtenerRutaVisual(origen, destino, modo) {
    console.log('=== INICIANDO OBTENER RUTA VISUAL ===');
    console.log('Coordenadas:', { origen, destino, modo });
    
    // Intentar obtener una ruta desde OpenRouteService
    let rutaData;
    try {
        console.log('🔄 Intentando obtener ruta real...');
        rutaData = await openRouteService.obtenerRuta(origen, destino, modo);
        
        console.log('📡 Respuesta del servicio recibida');
        console.log('Tiene routes:', !!rutaData?.routes);
        console.log('Número de routes:', rutaData?.routes?.length);
        
        if (!rutaData || !rutaData.routes || rutaData.routes.length === 0) {
            throw new Error('No se encontraron rutas válidas en la respuesta');
        }
        
        console.log('✅ Ruta obtenida exitosamente del servicio');
    } catch (error) {
        console.log('❌ Servicio falló, usando ruta simulada:', error.message);
        return crearRutaSimulada(origen, destino, modo);
    }
    
    // Usar la primera ruta
    const rutaPrincipal = rutaData.routes[0];
    console.log('📊 Analizando ruta principal');
    console.log('Tiene geometry:', !!rutaPrincipal.geometry);
    console.log('Tipo de geometry:', typeof rutaPrincipal.geometry);
    
    // Verificar que la ruta tenga geometría
    if (!rutaPrincipal.geometry) {
        console.log('❌ Ruta sin geometría, usando simulación');
        return crearRutaSimulada(origen, destino, modo);
    }
    
    try {
        // Preparar la ruta para visualización usando el formato estándar
        console.log('🔧 Preparando ruta para visualización...');
        const rutaVisual = prepararRutaVisual(rutaPrincipal);
        
        // Obtener puntos de seguridad e incidentes cercanos a la ruta
        const bounds = rutaPrincipal.bbox || calcularBounds(rutaVisual.geometry.coordinates);
        const puntosCercanos = await db.getPuntosEnRuta(bounds, 300);
        
        // Calcular índice de seguridad de la ruta
        const seguridadScore = await db.calcularIndiceSeguridad(bounds);
        
        // Formatear los puntos de seguridad para la respuesta
        const puntosSeguridad = formatearPuntosSeguridad(puntosCercanos);
        
        // Añadir el índice de seguridad a la ruta
        rutaVisual.seguridadScore = seguridadScore;
        
        console.log('✅ Ruta visual preparada exitosamente');
        console.log('📋 Resumen final:', {
            coordenadasEnGeometry: rutaVisual.geometry?.coordinates?.length,
            coordenadasEnCaracteristicas: rutaVisual.caracteristicas?.[0]?.geometria?.coordenadas?.length,
            distancia: rutaVisual.propiedades?.distancia,
            duracion: rutaVisual.propiedades?.duracion,
            seguridadScore: rutaVisual.seguridadScore,
            numPuntosSeguridad: puntosSeguridad.length
        });
        
        // Devolver ruta y puntos de seguridad
        return {
            ruta: rutaVisual,
            puntosSeguridad
        };
    } catch (error) {
        console.error('❌ Error al preparar ruta visual:', error);
        return crearRutaSimulada(origen, destino, modo);
    }
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
    generarRutaVisualSimulada,
    calcularBounds,
    decodificarPolyline
};