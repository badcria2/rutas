// src/utils/errorHandler.js

/**
 * Middleware para manejar errores en la aplicación
 */
const errorHandler = (err, req, res, next) => {
    console.error(`Error: ${err.message}`);
    
    // Determinar el código de estado HTTP apropiado
    const statusCode = err.statusCode || 500;
    
    // Crear respuesta de error estandarizada
    const errorResponse = {
      success: false,
      error: {
        message: err.message || 'Error interno del servidor',
        code: err.code || 'INTERNAL_SERVER_ERROR'
      }
    };
    
    // En modo desarrollo, incluir el stack de errores
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  };
  
  /**
   * Middleware para manejar rutas no encontradas
   */
  const notFoundHandler = (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Recurso no encontrado: ${req.originalUrl}`,
        code: 'NOT_FOUND'
      }
    });
  };
  
  /**
   * Crear un error con código de estado HTTP
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} code - Código de error interno
   * @returns {Error} Error con propiedades adicionales
   */
  const createError = (message, statusCode = 500, code = '') => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  };
  
  module.exports = {
    errorHandler,
    notFoundHandler,
    createError
  };