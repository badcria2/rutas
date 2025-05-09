/**
 * districts.js - Rutas para gestionar distritos y su información de seguridad
 */

const express = require('express');
const geocodingController = require('../controllers/Geocoding');
const router = express.Router();

 
router.get('/geocode', geocodingController.geocode);
router.get('/search', geocodingController.searchPlaces);
router.get('/streets', geocodingController.searchStreets);
router.get('/reverse', geocodingController.reverseGeocode);
router.get('/nearby', geocodingController.findNearby);
router.get('/district', geocodingController.findDistrict);
router.get('/suggest', geocodingController.suggestAddress);
router.get('/security-stats', geocodingController.getSecurityStats);

// Rutas para gestión de lugares (CRUD)
router.get('/places', placesController.getAllPlaces);
router.get('/places/:id', placesController.getPlaceById);
router.post('/places', placesController.createPlace);
router.put('/places/:id', placesController.updatePlace);
router.delete('/places/:id', placesController.deletePlace);
 
 
module.exports = router;