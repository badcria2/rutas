// src/controllers/districtController.js
const districtService = require('../services/districtService');
const { createError } = require('../utils/errorHandler');

class DistrictController {
  /**
   * Obtener todos los distritos
   */
  async getAllDistricts(req, res, next) {
    try {
      const districts = await districtService.getAllDistricts();
      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }

  /**
   * Obtener un distrito por ID
   */
  async getDistrictById(req, res, next) {
    try {
      const { id } = req.params;
      const district = await districtService.getDistrictById(id);
      res.json({
        success: true,
        data: district
      });
    } catch (error) {
      if (error.message === 'Distrito no encontrado') {
        next(createError(error.message, 404, 'DISTRICT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Obtener distrito por nombre
   */
  async getDistrictByName(req, res, next) {
    try {
      const { name } = req.params;
      const district = await districtService.getDistrictByName(name);
      res.json({
        success: true,
        data: district
      });
    } catch (error) {
      if (error.message === 'Distrito no encontrado') {
        next(createError(error.message, 404, 'DISTRICT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Crear un nuevo distrito
   */
  async createDistrict(req, res, next) {
    try {
      const district = await districtService.createDistrict(req.body);
      res.status(201).json({
        success: true,
        data: district,
        message: 'Distrito creado correctamente'
      });
    } catch (error) {
      next(createError(error.message, 400, 'INVALID_DISTRICT_DATA'));
    }
  }

  /**
   * Actualizar un distrito
   */
  async updateDistrict(req, res, next) {
    try {
      const { id } = req.params;
      const district = await districtService.updateDistrict(id, req.body);
      res.json({
        success: true,
        data: district,
        message: 'Distrito actualizado correctamente'
      });
    } catch (error) {
      if (error.message === 'Distrito no encontrado') {
        next(createError(error.message, 404, 'DISTRICT_NOT_FOUND'));
      } else {
        next(createError(error.message, 400, 'INVALID_DISTRICT_DATA'));
      }
    }
  }

  /**
   * Eliminar un distrito
   */
  async deleteDistrict(req, res, next) {
    try {
      const { id } = req.params;
      await districtService.deleteDistrict(id);
      res.json({
        success: true,
        message: 'Distrito eliminado correctamente'
      });
    } catch (error) {
      if (error.message === 'Distrito no encontrado') {
        next(createError(error.message, 404, 'DISTRICT_NOT_FOUND'));
      } else {
        next(createError(error.message, 500));
      }
    }
  }

  /**
   * Obtener distritos ordenados por nivel de seguridad
   */
  async getDistrictsSortedBySecurity(req, res, next) {
    try {
      const { order } = req.query;
      const districts = await districtService.getDistrictsSortedBySecurity(order);
      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      next(createError(error.message, 500));
    }
  }
}

module.exports = new DistrictController();