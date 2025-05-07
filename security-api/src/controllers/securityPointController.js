// src/controllers/securityPointController.js
const securityPointService = require('../services/securityPointService');
const { createError } = require('../utils/errorHandler');

class SecurityPointController {
  /**
   * Obtener todos los puntos de seguridad
   */
  async getAllSecurityPoints(req, res, next) {
    try {
      const securityPoints = await securityPointService.getAllSecurityPoints();
      res.json({
        success: true,
        data: securityPoints
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener un punto de seguridad por ID
   */
  async getSecurityPointById(req, res, next) {
    try {
      const { id } = req.params;
      const securityPoint = await securityPointService.getSecurityPointById(id);
      res.json({
        success: true,
        data: securityPoint
      });
    } catch (error) {
      if (error.message === 'Punto de seguridad no encontrado') {
        next(createError(error.message, 404, 'SECURITY_POINT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Crear un nuevo punto de seguridad
   */
  async createSecurityPoint(req, res, next) {
    try {
      const securityPoint = await securityPointService.createSecurityPoint(req.body);
      res.status(201).json({
        success: true,
        data: securityPoint,
        message: 'Punto de seguridad creado correctamente'
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_SECURITY_POINT_DATA'));
    }
  }

  /**
   * Actualizar un punto de seguridad
   */
  async updateSecurityPoint(req, res, next) {
    try {
      const { id } = req.params;
      const securityPoint = await securityPointService.updateSecurityPoint(id, req.body);
      res.json({
        success: true,
        data: securityPoint,
        message: 'Punto de seguridad actualizado correctamente'
      });
    } catch (error) {
      if (error.message === 'Punto de seguridad no encontrado') {
        next(createError(error.message, 404, 'SECURITY_POINT_NOT_FOUND'));
      } else {
        next(createError(error.message, 400, 'INVALID_SECURITY_POINT_DATA'));
      }
    }
  }

  /**
   * Eliminar un punto de seguridad
   */
  async deleteSecurityPoint(req, res, next) {
    try {
      const { id } = req.params;
      await securityPointService.deleteSecurityPoint(id);
      res.json({
        success: true,
        message: 'Punto de seguridad eliminado correctamente'
      });
    } catch (error) {
      if (error.message === 'Punto de seguridad no encontrado') {
        next(createError(error.message, 404, 'SECURITY_POINT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Obtener puntos de seguridad por tipo
   */
  async getSecurityPointsByType(req, res, next) {
    try {
      const { type } = req.params;
      const securityPoints = await securityPointService.getSecurityPointsByType(type);
      res.json({
        success: true,
        data: securityPoints
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener puntos de seguridad por nivel de seguridad
   */
  async getSecurityPointsBySecurityLevel(req, res, next) {
    try {
      const { level } = req.params;
      const securityPoints = await securityPointService.getSecurityPointsBySecurityLevel(level);
      res.json({
        success: true,
        data: securityPoints
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener puntos de seguridad por proximidad
   */
  async getSecurityPointsByProximity(req, res, next) {
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
      
      const securityPoints = await securityPointService.getSecurityPointsByProximity(
        latitude, longitude, radiusKm
      );
      
      res.json({
        success: true,
        data: securityPoints
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_COORDINATES'));
    }
  }
}

module.exports = new SecurityPointController();