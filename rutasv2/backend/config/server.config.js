/**
 * server.config.js
 * Configuración del servidor
 */

const path = require('path');

const serverConfig = {
    // Puerto en el que se ejecutará el servidor
    port: process.env.PORT || 3000,
    
    // Opciones de CORS
    corsOptions: {
        origin: '*',
        optionsSuccessStatus: 200
    },
    
    // Ruta a la carpeta de archivos estáticos
    staticFolder: path.join(__dirname, '../../frontend'),
    
    // Configuración de logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
    },
    
    // Configuración de seguridad
    security: {
        // Para futuras implementaciones de autenticación
        jwtSecret: process.env.JWT_SECRET || 'rutas_seguras_jwt_secret',
        jwtExpiration: '24h'
    }
};

module.exports = serverConfig;