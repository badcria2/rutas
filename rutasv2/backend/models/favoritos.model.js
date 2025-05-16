/**
 * Modelo para rutas favoritas
 */

const db = require('../db/db');

/**
 * Obtiene todas las rutas favoritas de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} - Array de rutas favoritas
 */
async function getRutasFavoritasPorUsuario(usuarioId) {
    try {
        return await db.getRutasFavoritas(usuarioId);
    } catch (error) {
        console.error('Error en modelo getRutasFavoritasPorUsuario:', error);
        throw error;
    }
}

/**
 * Obtiene una ruta favorita por su ID
 * @param {number} rutaId - ID de la ruta
 * @returns {Promise<Object>} - Ruta favorita
 */
async function getRutaFavoritaPorId(rutaId) {
    try {
        return await db.getRutaFavoritaPorId(rutaId);
    } catch (error) {
        console.error('Error en modelo getRutaFavoritaPorId:', error);
        throw error;
    }
}

/**
 * Guarda una nueva ruta favorita
 * @param {Object} rutaData - Datos de la ruta
 * @returns {Promise<Object>} - Ruta guardada
 */
async function crearRutaFavorita(rutaData) {
    try {
        return await db.guardarRutaFavorita(rutaData);
    } catch (error) {
        console.error('Error en modelo crearRutaFavorita:', error);
        throw error;
    }
}

/**
 * Actualiza una ruta favorita existente
 * @param {number} rutaId - ID de la ruta
 * @param {Object} rutaData - Nuevos datos de la ruta
 * @returns {Promise<Object>} - Ruta actualizada
 */
async function actualizarRutaFavorita(rutaId, rutaData) {
    try {
        return await db.actualizarRutaFavorita(rutaId, rutaData);
    } catch (error) {
        console.error('Error en modelo actualizarRutaFavorita:', error);
        throw error;
    }
}

/**
 * Elimina una ruta favorita
 * @param {number} rutaId - ID de la ruta
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarRutaFavorita(rutaId) {
    try {
        return await db.eliminarRutaFavorita(rutaId);
    } catch (error) {
        console.error('Error en modelo eliminarRutaFavorita:', error);
        throw error;
    }
}

module.exports = {
    getRutasFavoritasPorUsuario,
    getRutaFavoritaPorId,
    crearRutaFavorita,
    actualizarRutaFavorita,
    eliminarRutaFavorita
};