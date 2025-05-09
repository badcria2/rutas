/**
 * securityPoints.js - Rutas para gestionar puntos de seguridad
 */

const express = require('express');
const securityPointController = require('../controllers/securityPointController');
const router = express.Router();

/**
 * @route   GET /api/security-points
 * @desc    Obtener todos los puntos de seguridad
 * @access  Public
 */
router.get('/', securityPointController.getAllSecurityPoints);

/**
 * @route   GET /api/security-points/:id
 * @desc    Obtener un punto de seguridad específico por ID
 * @access  Public
 */
router.get('/:id', securityPointController.getSecurityPointById);

/**
 * @route   GET /api/security-points/type/:type
 * @desc    Obtener puntos de seguridad por tipo (police, commercial, park, risk, monitored, lighting)
 * @access  Public
 */
router.get('/type/:type', securityPointController.getSecurityPointsByType);

/**
 * @route   GET /api/security-points/level/:level
 * @desc    Obtener puntos de seguridad por nivel (high, medium, low)
 * @access  Public
 */
//router.get('/level/:level', securityPointController.getSecurityPointsByLevel);

/**
 * @route   GET /api/security-points/nearby
 * @desc    Obtener puntos de seguridad cercanos a una ubicación
 * @access  Public
 */
//router.get('/nearby', securityPointController.getNearbySecurityPoints);

/**
 * @route   POST /api/security-points
 * @desc    Crear un nuevo punto de seguridad
 * @access  Private
 */
router.post('/', securityPointController.createSecurityPoint);

/**
 * @route   PUT /api/security-points/:id
 * @desc    Actualizar un punto de seguridad existente
 * @access  Private
 */
router.put('/:id', securityPointController.updateSecurityPoint);

/**
 * @route   DELETE /api/security-points/:id
 * @desc    Eliminar un punto de seguridad
 * @access  Private
 */
router.delete('/:id', securityPointController.deleteSecurityPoint);

module.exports = router;