const express = require('express');
const router = express.Router();
const favoriteRouteController = require('../controllers/favoriteRouteController');

// POST /api/favorites
router.post('/', favoriteRouteController.addFavoriteRoute);

// GET /api/favorites
router.get('/', favoriteRouteController.getFavoriteRoutes);

// DELETE /api/favorites/:id
router.delete('/:id', favoriteRouteController.deleteFavoriteRoute);

module.exports = router;