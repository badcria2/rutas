// src/services/securityPointService.js
const SecurityPoint = require('../models/securityPoint');

class SecurityPointService {
  async getAllSecurityPoints() {
    try {
      return await SecurityPoint.getAll();
    } catch (error) {
      throw new Error(`Error al obtener puntos de seguridad: ${error.message}`);
    }
  }

  async getSecurityPointById(id) {
    try {
      const securityPoint = await SecurityPoint.getById(id);
      if (!securityPoint) {
        throw new Error('Punto de seguridad no encontrado');
      }
      return securityPoint;
    } catch (error) {
      throw new Error(`Error al obtener punto de seguridad: ${error.message}`);
    }
  }

  async createSecurityPoint(securityPointData) {
    try {
      // Validación básica
      if (!securityPointData.name || !securityPointData.type || !securityPointData.security_level) {
        throw new Error('Nombre, tipo y nivel de seguridad son requeridos');
      }
      
      // Validar tipos de puntos de seguridad
      const validTypes = ['police', 'commercial', 'park', 'monitored', 'lighting', 'risk'];
      if (!validTypes.includes(securityPointData.type)) {
        throw new Error(`Tipo no válido. Tipos permitidos: ${validTypes.join(', ')}`);
      }

      // Validar niveles de seguridad
      const validLevels = ['high', 'medium', 'low'];
      if (!validLevels.includes(securityPointData.security_level)) {
        throw new Error(`Nivel de seguridad no válido. Niveles permitidos: ${validLevels.join(', ')}`);
      }

      return await SecurityPoint.create(securityPointData);
    } catch (error) {
      throw new Error(`Error al crear punto de seguridad: ${error.message}`);
    }
  }

  async updateSecurityPoint(id, securityPointData) {
    try {
      // Verificar que el punto de seguridad existe
      const existingPoint = await SecurityPoint.getById(id);
      if (!existingPoint) {
        throw new Error('Punto de seguridad no encontrado');
      }

      // Validar tipos de puntos de seguridad si se proporciona
      if (securityPointData.type) {
        const validTypes = ['police', 'commercial', 'park', 'monitored', 'lighting', 'risk'];
        if (!validTypes.includes(securityPointData.type)) {
          throw new Error(`Tipo no válido. Tipos permitidos: ${validTypes.join(', ')}`);
        }
      }

      // Validar niveles de seguridad si se proporciona
      if (securityPointData.security_level) {
        const validLevels = ['high', 'medium', 'low'];
        if (!validLevels.includes(securityPointData.security_level)) {
          throw new Error(`Nivel de seguridad no válido. Niveles permitidos: ${validLevels.join(', ')}`);
        }
      }

      return await SecurityPoint.update(id, {
        name: securityPointData.name || existingPoint.name,
        latitude: securityPointData.latitude || existingPoint.latitude,
        longitude: securityPointData.longitude || existingPoint.longitude,
        type: securityPointData.type || existingPoint.type,
        security_level: securityPointData.security_level || existingPoint.security_level
      });
    } catch (error) {
      throw new Error(`Error al actualizar punto de seguridad: ${error.message}`);
    }
  }

  async deleteSecurityPoint(id) {
    try {
      const securityPoint = await SecurityPoint.delete(id);
      if (!securityPoint) {
        throw new Error('Punto de seguridad no encontrado');
      }
      return securityPoint;
    } catch (error) {
      throw new Error(`Error al eliminar punto de seguridad: ${error.message}`);
    }
  }

  async getSecurityPointsByType(type) {
    try {
      return await SecurityPoint.getByType(type);
    } catch (error) {
      throw new Error(`Error al obtener puntos de seguridad por tipo: ${error.message}`);
    }
  }

  async getSecurityPointsBySecurityLevel(level) {
    try {
      return await SecurityPoint.getBySecurityLevel(level);
    } catch (error) {
      throw new Error(`Error al obtener puntos de seguridad por nivel: ${error.message}`);
    }
  }

  async getSecurityPointsByProximity(lat, lng, radiusKm) {
    try {
      return await SecurityPoint.getByProximity(lat, lng, radiusKm);
    } catch (error) {
      throw new Error(`Error al obtener puntos de seguridad por proximidad: ${error.message}`);
    }
  }
}

module.exports = new SecurityPointService();