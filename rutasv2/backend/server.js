/**
 * server.js
 * Punto de entrada principal para el servidor backend de la aplicación Rutas Seguras Lima
 */

// Importar módulos externos
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Importar configuraciones
const serverConfig = require('./config/server.config');
const dbConfig = require('./config/db.config');

// Importar base de datos
const db = require('./db/db');

// Importar middleware
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

// Importar rutas
const apiRoutes = require('./routes/index');

// Configuración del servidor
const app = express();
const PORT = serverConfig.port;

// Middleware
app.use(cors(serverConfig.corsOptions));
app.use(bodyParser.json());
app.use(express.static(serverConfig.staticFolder));

// Rutas API
app.use('/api', apiRoutes);

// Ruta principal sirve la aplicación
app.get('/', (req, res) => {
    res.sendFile(path.join(serverConfig.staticFolder, 'index.html'));
});

// Middleware para manejar rutas no encontradas
app.use(notFoundHandler);

// Middleware para manejo de errores
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});