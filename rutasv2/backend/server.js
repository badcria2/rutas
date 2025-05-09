/**
 * server.js
 * Punto de entrada principal para el servidor backend de la aplicación Rutas Seguras Lima
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // PostgreSQL client
const axios = require('axios'); // Para llamadas a OpenRouteService API
require('dotenv').config(); // Para cargar variables de entorno desde .env

// Importar rutas API
const apiRoutes = require('./routes/api');

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Habilitar CORS
app.use(bodyParser.json()); // Parsear peticiones JSON
app.use(express.static(path.join(__dirname, '../frontend'))); // Servir archivos estáticos

// Conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'security_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Comprobar conexión a la base de datos
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err);
    } else {
        console.log('Conexión a PostgreSQL establecida con éxito');
    }
});

// Hacer disponible la conexión a la base de datos para las rutas
app.locals.db = pool;

// Configurar token de OpenRouteService
app.locals.openRouteServiceApiKey = process.env.OPENROUTE_API_KEY || ''; // Token de acceso a OpenRouteService

// Rutas API
app.use('/api', apiRoutes);   

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Ruta principal sirve la aplicación
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error inesperado'
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});