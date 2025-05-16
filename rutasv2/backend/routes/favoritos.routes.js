const express = require('express');
const router = express.Router();
const favoritosController = require('../controllers/favoritos.controller');

// GET /api/ruta-favorita
router.get('/ruta-favorita', favoritosController.getRutasFavoritas);

// GET /api/ruta-favorita/:id
router.get('/ruta-favorita/:id', favoritosController.getRutaFavoritaPorId);

// POST /api/ruta-favorita
router.post('/ruta-favorita', favoritosController.guardarRutaFavorita);

// PUT /api/ruta-favorita/:id
router.put('/ruta-favorita/:id', favoritosController.actualizarRutaFavorita);

// DELETE /api/ruta-favorita/:id
router.delete('/ruta-favorita/:id', favoritosController.eliminarRutaFavorita);

module.exports = router;