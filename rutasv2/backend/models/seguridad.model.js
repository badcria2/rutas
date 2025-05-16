/**
 * Modelo para puntos de seguridad
 */

const db = require('../db/db');

/**
 * Obtiene todos los puntos de seguridad dentro de un radio
 * @param {number} lat - Latitud del centro
 * @param {number} lng - Longitud del centro
 * @param {number} radiusMeters - Radio en metros
 * @returns {Promise<Array>} - Array de puntos de seguridad
 */
async function getPuntosSeguridadCercanos(lat, lng, radiusMeters = 500) {
    try {
        return await db.getPuntosSeguridad(lat, lng, radiusMeters);
    } catch (error) {
        console.error('Error en modelo getPuntosSeguridadCercanos:', error);
        throw error;
    }
}

module.exports = {
    getPuntosSeguridadCercanos
};