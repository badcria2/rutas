const express = require('express');
const router = express.Router();
const rutasController = require('../controllers/rutas.controller');

// POST /api/rutas-seguras
router.post('/rutas-seguras', rutasController.getRutaSegura);

// GET /api/rutas-alternativas
router.get('/rutas-alternativas', rutasController.getRutasAlternativas);

// GET /api/ruta-visual
router.get('/ruta-visual', rutasController.getRutaVisual);

module.exports = router;