/**
 * districts.js - Rutas para gestionar distritos y su información de seguridad
 */

const express = require('express');
const districtController = require('../controllers/districtController');
const router = express.Router();

/**
 * @route   GET /api/districts
 * @desc    Obtener todos los distritos con su nivel de seguridad
 * @access  Public
 */
router.get('/', districtController.getAllDistricts);

/**
 * @route   GET /api/districts/:name
 * @desc    Obtener información de un distrito específico
 * @access  Public
 */
router.get('/:name', districtController.getDistrictByName);

/**
 * @route   GET /api/districts/ranking/safety
 * @desc    Obtener ranking de distritos por nivel de seguridad
 * @access  Public
 */
//router.get('/ranking/safety', districtController.getDistrictsBySecurityRanking);

/**
 * @route   GET /api/districts/search
 * @desc    Buscar distritos por nivel de seguridad mínimo
 * @access  Public
 */
//router.get('/search/by-security-level', districtController.searchDistrictsBySecurityLevel);

/**
 * @route   GET /api/districts/:name/incidents
 * @desc    Obtener incidentes reportados en un distrito específico
 * @access  Public
 */
//router.get('/:name/incidents', districtController.getDistrictIncidents);

/**
 * @route   GET /api/districts/:name/security-points
 * @desc    Obtener puntos de seguridad en un distrito específico
 * @access  Public
 */
//router.get('/:name/security-points', districtController.getDistrictSecurityPoints);

module.exports = router;