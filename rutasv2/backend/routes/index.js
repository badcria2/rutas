const express = require('express');
const router = express.Router();

// Importar todos los routers
const seguridadRoutes = require('./seguridad.routes');
const incidentesRoutes = require('./incidentes.routes');
const rutasRoutes = require('./rutas.routes');
const favoritosRoutes = require('./favoritos.routes');

// Configurar rutas
router.use(seguridadRoutes);
router.use(incidentesRoutes);
router.use(rutasRoutes);
router.use(favoritosRoutes);

module.exports = router;