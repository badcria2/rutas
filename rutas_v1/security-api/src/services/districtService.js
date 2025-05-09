// src/services/districtService.js
const District = require('../models/district');

class DistrictService {
  async getAllDistricts() {
    try {
      return await District.getAll();
    } catch (error) {
      throw new Error(`Error al obtener distritos: ${error.message}`);
    }
  }

  async getDistrictById(id) {
    try {
      const district = await District.getById(id);
      if (!district) {
        throw new Error('Distrito no encontrado');
      }
      return district;
    } catch (error) {
      throw new Error(`Error al obtener distrito: ${error.message}`);
    }
  }

  async getDistrictByName(name) {
    try {
      const district = await District.getByName(name);
      if (!district) {
        throw new Error('Distrito no encontrado');
      }
      return district;
    } catch (error) {
      throw new Error(`Error al obtener distrito por nombre: ${error.message}`);
    }
  }

  async createDistrict(districtData) {
    try {
      // Validación básica
      if (!districtData.name || !districtData.security_level) {
        throw new Error('Nombre y nivel de seguridad son requeridos');
      }
      
      if (districtData.security_level < 0 || districtData.security_level > 100) {
        throw new Error('El nivel de seguridad debe estar entre 0 y 100');
      }

      return await District.create(districtData);
    } catch (error) {
      throw new Error(`Error al crear distrito: ${error.message}`);
    }
  }

  async updateDistrict(id, districtData) {
    try {
      // Verificar que el distrito existe
      const existingDistrict = await District.getById(id);
      if (!existingDistrict) {
        throw new Error('Distrito no encontrado');
      }

      // Validación básica
      if (districtData.security_level && (districtData.security_level < 0 || districtData.security_level > 100)) {
        throw new Error('El nivel de seguridad debe estar entre 0 y 100');
      }

      return await District.update(id, {
        name: districtData.name || existingDistrict.name,
        security_level: districtData.security_level || existingDistrict.security_level,
        latitude: districtData.latitude || existingDistrict.latitude,
        longitude: districtData.longitude || existingDistrict.longitude
      });
    } catch (error) {
      throw new Error(`Error al actualizar distrito: ${error.message}`);
    }
  }

  async deleteDistrict(id) {
    try {
      const district = await District.delete(id);
      if (!district) {
        throw new Error('Distrito no encontrado');
      }
      return district;
    } catch (error) {
      throw new Error(`Error al eliminar distrito: ${error.message}`);
    }
  }

  async getDistrictsSortedBySecurity(order) {
    try {
      return await District.getDistrictsSortedBySecurity(order);
    } catch (error) {
      throw new Error(`Error al obtener distritos ordenados por seguridad: ${error.message}`);
    }
  }
}

module.exports = new DistrictService();