/**
 * Middleware para manejo centralizado de errores
 */

const responseUtils = require('../utils/response.utils');

/**
 * Middleware para manejar rutas no encontradas (404)
 */
function notFoundHandler(req, res, next) {
    const errorMessage = `Ruta no encontrada: ${req.originalUrl}`;
    res.status(404).json(responseUtils.error(errorMessage, 404));
}

/**
 * Middleware para manejo de errores globales
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    
    // Determinar código de estado y mensaje
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Error interno del servidor';
    
    // Enviar respuesta de error
    res.status(statusCode).json(responseUtils.error(message, statusCode, err));
}

module.exports = {
    notFoundHandler,
    errorHandler
};