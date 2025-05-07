/**
 * incidents.js - Rutas para gestionar incidentes de seguridad reportados
 */

const express = require('express');
const incidentController = require('../controllers/incidentController');
const router = express.Router();

/**
 * @route   GET /api/incidents
 * @desc    Obtener todos los incidentes reportados
 * @access  Public
 */
router.get('/', incidentController.getAllIncidents);

/**
 * @route   GET /api/incidents/:id
 * @desc    Obtener un incidente específico por ID
 * @access  Public
 */
router.get('/:id', incidentController.getIncidentById);

/**
 * @route   GET /api/incidents/type/:type
 * @desc    Obtener incidentes por tipo (Robo, Asalto, Sospechoso, Vandalismo)
 * @access  Public
 */
router.get('/type/:type', incidentController.getIncidentsByType);

/**
 * @route   GET /api/incidents/date/:date
 * @desc    Obtener incidentes por fecha específica (YYYY-MM-DD)
 * @access  Public
 */
router.get('/date/:date', incidentController.getIncidentsByDate);

/**
 * @route   GET /api/incidents/date-range
 * @desc    Obtener incidentes dentro de un rango de fechas
 * @access  Public
 */
router.get('/date-range', incidentController.getIncidentsByDateRange);

/**
 * @route   GET /api/incidents/nearby
 * @desc    Obtener incidentes cercanos a una ubicación (necesita lat y lng en query)
 * @access  Public
 */
router.get('/nearby', incidentController.getNearbyIncidents);

/**
 * @route   POST /api/incidents
 * @desc    Reportar un nuevo incidente
 * @access  Public
 */
router.post('/', incidentController.reportIncident);

/**
 * @route   PUT /api/incidents/:id
 * @desc    Actualizar información de un incidente existente
 * @access  Private
 */
router.put('/:id', incidentController.updateIncident);

/**
 * @route   DELETE /api/incidents/:id
 * @desc    Eliminar un incidente reportado
 * @access  Private
 */
router.delete('/:id', incidentController.deleteIncident);

/**
 * @route   GET /api/incidents/stats/weekly
 * @desc    Obtener estadísticas semanales de incidentes
 * @access  Public
 */
router.get('/stats/weekly', incidentController.getWeeklyIncidentStats);

/**
 * @route   GET /api/incidents/stats/by-district
 * @desc    Obtener estadísticas de incidentes por distrito
 * @access  Public
 */
router.get('/stats/by-district', incidentController.getIncidentStatsByDistrict);

module.exports = router;