/**
 * Utilidades para formatear respuestas y manejar errores
 */

/**
 * Formatea una respuesta exitosa
 * @param {Object} data - Datos a incluir en la respuesta
 * @param {string} message - Mensaje de éxito
 * @param {number} statusCode - Código de estado HTTP
 * @returns {Object} - Respuesta formateada
 */
function success(data, message = 'Operación exitosa', statusCode = 200) {
    return {
        success: true,
        statusCode,
        message,
        data
    };
}

/**
 * Formatea una respuesta de error
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP
 * @param {Object} error - Objeto de error original
 * @returns {Object} - Respuesta de error formateada
 */
function error(message = 'Error al procesar la solicitud', statusCode = 500, error = null) {
    const response = {
        success: false,
        statusCode,
        message
    };
    
    // En modo desarrollo, incluir detalles del error
    if (process.env.NODE_ENV === 'development' && error) {
        response.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }
    
    return response;
}

module.exports = {
    success,
    error
};