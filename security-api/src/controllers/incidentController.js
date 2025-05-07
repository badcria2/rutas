// src/controllers/incidentController.js
const incidentService = require('../services/incidentService');
const { createError } = require('../utils/errorHandler');

class IncidentController {
  /**
   * Obtener todos los incidentes
   */
  async getAllIncidents(req, res, next) {
    try {
      const incidents = await incidentService.getAllIncidents();
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener un incidente por ID
   */
  async getIncidentById(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.getIncidentById(id);
      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      if (error.message === 'Incidente no encontrado') {
        next(createError(error.message, 404, 'INCIDENT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Crear un nuevo incidente
   */
  async createIncident(req, res, next) {
    try {
      const incident = await incidentService.createIncident(req.body);
      res.status(201).json({
        success: true,
        data: incident,
        message: 'Incidente creado correctamente'
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_INCIDENT_DATA'));
    }
  }

  /**
   * Actualizar un incidente
   */
  async updateIncident(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.updateIncident(id, req.body);
      res.json({
        success: true,
        data: incident,
        message: 'Incidente actualizado correctamente'
      });
    } catch (error) {
      if (error.message === 'Incidente no encontrado') {
        next(createError(error.message, 404, 'INCIDENT_NOT_FOUND'));
      } else {
        next(createError(error.message, 400, 'INVALID_INCIDENT_DATA'));
      }
    }
  }

  /**
   * Eliminar un incidente
   */
  async deleteIncident(req, res, next) {
    try {
      const { id } = req.params;
      await incidentService.deleteIncident(id);
      res.json({
        success: true,
        message: 'Incidente eliminado correctamente'
      });
    } catch (error) {
      if (error.message === 'Incidente no encontrado') {
        next(createError(error.message, 404, 'INCIDENT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Obtener incidentes por tipo
   */
  async getIncidentsByType(req, res, next) {
    try {
      const { type } = req.params;
      const incidents = await incidentService.getIncidentsByType(type);
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener incidentes por rango de fechas
   */
  async getIncidentsByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new Error('Fechas de inicio y fin son requeridas');
      }
      
      const incidents = await incidentService.getIncidentsByDateRange(startDate, endDate);
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_DATE_RANGE'));
    }
  }

  /**
   * Obtener incidentes por proximidad
   */
  async getIncidentsByProximity(req, res, next) {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        throw new Error('Latitud y longitud son requeridas');
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 1;
      
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        throw new Error('Latitud, longitud y radio deben ser números válidos');
      }
      
      const incidents = await incidentService.getIncidentsByProximity(
        latitude, longitude, radiusKm
      );
      
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_COORDINATES'));
    }
  }

  /**
   * Obtener incidentes recientes
   */
  async getRecentIncidents(req, res, next) {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days) : 7;
      
      if (isNaN(daysNum) || daysNum <= 0) {
        throw new Error('El número de días debe ser un número positivo');
      }
      
      const incidents = await incidentService.getRecentIncidents(daysNum);
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_DAYS_PARAMETER'));
    }
  }
}

module.exports = new IncidentController();