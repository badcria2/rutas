const express = require('express');
const router = express.Router();
const incidentesController = require('../controllers/incidentes.controller');

// GET /api/incidentes
router.get('/incidentes', incidentesController.getIncidentes);

// POST /api/incidentes
router.post('/incidentes', incidentesController.registrarIncidente);

module.exports = router;