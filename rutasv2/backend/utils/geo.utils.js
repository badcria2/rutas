/**
 * Funciones de utilidad para cálculos geográficos
 */

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Object} p1 - Primer punto {lat, lng}
 * @param {Object} p2 - Segundo punto {lat, lng}
 * @returns {number} - Distancia en metros
 */
function calcularDistancia(p1, p2) {
    const R = 6371000; // Radio de la Tierra en metros
    const rad = Math.PI / 180;
    const lat1 = p1.lat * rad;
    const lat2 = p2.lat * rad;
    const sinDLat = Math.sin((p2.lat - p1.lat) * rad / 2);
    const sinDLon = Math.sin((p2.lng - p1.lng) * rad / 2);
    const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calcula la distancia total de una ruta
 * @param {Array} puntos - Array de puntos {lat, lng}
 * @returns {number} - Distancia total en metros
 */
function calcularDistanciaTotal(puntos) {
    let distancia = 0;
    for (let i = 0; i < puntos.length - 1; i++) {
        distancia += calcularDistancia(puntos[i], puntos[i + 1]);
    }
    return distancia;
}

/**
 * Calcula la distancia aproximada entre dos puntos
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @returns {number} - Distancia en metros
 */
function calcularDistanciaSimulada(origen, destino) {
    // Fórmula de Haversine para calcular distancia en metros
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = origen.lat * Math.PI/180;
    const lat2 = destino.lat * Math.PI/180;
    const deltaLat = (destino.lat - origen.lat) * Math.PI/180;
    const deltaLng = (destino.lng - origen.lng) * Math.PI/180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    return distancia;
}

/**
 * Calcula la distancia total de una ruta basada en sus coordenadas
 * @param {Array} coordenadas - Array de coordenadas [lng, lat]
 * @returns {number} - Distancia total en metros
 */
function calcularDistanciaRutaCompleta(coordenadas) {
    let distanciaTotal = 0;
    
    for (let i = 0; i < coordenadas.length - 1; i++) {
        const punto1 = {
            lat: coordenadas[i][1],
            lng: coordenadas[i][0]
        };
        const punto2 = {
            lat: coordenadas[i+1][1],
            lng: coordenadas[i+1][0]
        };
        
        distanciaTotal += calcularDistanciaSimulada(punto1, punto2);
    }
    
    return distanciaTotal;
}

module.exports = {
    calcularDistancia,
    calcularDistanciaTotal,
    calcularDistanciaSimulada,
    calcularDistanciaRutaCompleta
};