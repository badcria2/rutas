/**
 * index.js - Router principal que combina todas las rutas de la API
 */

const express = require('express');
const districtRoutes = require('./districts');
const securityPointRoutes = require('./securityPoints');
const incidentRoutes = require('./incidents');
const favoriteRoutes = require('./favorites');
const geocoding = require('./geocoding');

const router = express.Router();

// Ruta base para verificar que la API está funcionando
router.get('/', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'API de Seguridad Lima funcionando correctamente',
    version: '1.0.0'
  });
});

// Registrar todas las rutas
router.use('/districts', districtRoutes);
router.use('/security-points', securityPointRoutes);
router.use('/incidents', incidentRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/geocoding', geocoding);

module.exports = router;