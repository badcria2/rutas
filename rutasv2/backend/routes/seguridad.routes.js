const express = require('express');
const router = express.Router();
const seguridadController = require('../controllers/seguridad.controller');

// GET /api/puntos-seguridad
router.get('/puntos-seguridad', seguridadController.getPuntosSeguridad);

module.exports = router;