/**
 * src/app.js
 * Configuración principal de la aplicación Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');
const { globalErrorHandler } = require('../utils/errorHandler');
const config = require('../config/app');

// Rutas principales
const geocodingRoutes = require('../routes/geocodingRoutes');

// Crear la aplicación Express
const app = express();

// Middlewares de seguridad y rendimiento
app.use(helmet()); // Configurar encabezados de seguridad
app.use(cors(config.cors)); // Habilitar CORS
app.use(compression()); // Comprimir respuestas

// Logging de solicitudes HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(logger.requestLogger);
}

// Parsear solicitudes JSON
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Aplicar limitador de tasa global
app.use(rateLimiter);

// Ruta de verificación de estado del servicio
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'geocoding-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Montar rutas de la API
app.use(`${config.apiPrefix}/geocoding`, geocodingRoutes);

// Manejar rutas no encontradas
app.all('*', (req, res, next) => {
  const err = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

// Middleware global de manejo de errores
app.use(globalErrorHandler);

module.exports = app;