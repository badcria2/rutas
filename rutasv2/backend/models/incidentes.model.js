/**
 * Modelo para incidentes
 */

const db = require('../db/db');

/**
 * Obtiene todos los incidentes reportados dentro de un radio
 * @param {number} lat - Latitud del centro
 * @param {number} lng - Longitud del centro
 * @param {number} radiusMeters - Radio en metros
 * @returns {Promise<Array>} - Array de incidentes
 */
async function getIncidentesCercanos(lat, lng, radiusMeters = 500) {
    try {
        return await db.getIncidentes(lat, lng, radiusMeters);
    } catch (error) {
        console.error('Error en modelo getIncidentesCercanos:', error);
        throw error;
    }
}

/**
 * Registra un nuevo incidente
 * @param {Object} incidenteData - Datos del incidente
 * @returns {Promise<Object>} - Incidente registrado
 */
async function crearIncidente(incidenteData) {
    try {
        return await db.registrarIncidente(incidenteData);
    } catch (error) {
        console.error('Error en modelo crearIncidente:', error);
        throw error;
    }
}

module.exports = {
    getIncidentesCercanos,
    crearIncidente
};