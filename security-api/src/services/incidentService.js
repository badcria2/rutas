// src/services/incidentService.js
const Incident = require('../models/incident');

class IncidentService {
  async getAllIncidents() {
    try {
      return await Incident.getAll();
    } catch (error) {
      throw new Error(`Error al obtener incidentes: ${error.message}`);
    }
  }

  async getIncidentById(id) {
    try {
      const incident = await Incident.getById(id);
      if (!incident) {
        throw new Error('Incidente no encontrado');
      }
      return incident;
    } catch (error) {
      throw new Error(`Error al obtener incidente: ${error.message}`);
    }
  }

  async createIncident(incidentData) {
    try {
      // Validación básica
      if (!incidentData.type || !incidentData.description || !incidentData.latitude || !incidentData.longitude || !incidentData.date) {
        throw new Error('Tipo, descripción, ubicación y fecha son requeridos');
      }
      
      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentData.date)) {
        throw new Error('El formato de fecha debe ser YYYY-MM-DD');
      }

      return await Incident.create(incidentData);
    } catch (error) {
      throw new Error(`Error al crear incidente: ${error.message}`);
    }
  }

  async updateIncident(id, incidentData) {
    try {
      // Verificar que el incidente existe
      const existingIncident = await Incident.getById(id);
      if (!existingIncident) {
        throw new Error('Incidente no encontrado');
      }

      // Validar formato de fecha si se proporciona
      if (incidentData.date && !/^\d{4}-\d{2}-\d{2}$/.test(incidentData.date)) {
        throw new Error('El formato de fecha debe ser YYYY-MM-DD');
      }

      return await Incident.update(id, {
        type: incidentData.type || existingIncident.type,
        description: incidentData.description || existingIncident.description,
        latitude: incidentData.latitude || existingIncident.latitude,
        longitude: incidentData.longitude || existingIncident.longitude,
        date: incidentData.date || existingIncident.date
      });
    } catch (error) {
      throw new Error(`Error al actualizar incidente: ${error.message}`);
    }
  }

  async deleteIncident(id) {
    try {
      const incident = await Incident.delete(id);
      if (!incident) {
        throw new Error('Incidente no encontrado');
      }
      return incident;
    } catch (error) {
      throw new Error(`Error al eliminar incidente: ${error.message}`);
    }
  }

  async getIncidentsByType(type) {
    try {
      return await Incident.getByType(type);
    } catch (error) {
      throw new Error(`Error al obtener incidentes por tipo: ${error.message}`);
    }
  }

  async getIncidentsByDateRange(startDate, endDate) {
    try {
      // Validar formato de fechas
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('El formato de fecha debe ser YYYY-MM-DD');
      }
      
      return await Incident.getByDateRange(startDate, endDate);
    } catch (error) {
      throw new Error(`Error al obtener incidentes por rango de fechas: ${error.message}`);
    }
  }

  async getIncidentsByProximity(lat, lng, radiusKm) {
    try {
      return await Incident.getByProximity(lat, lng, radiusKm);
    } catch (error) {
      throw new Error(`Error al obtener incidentes por proximidad: ${error.message}`);
    }
  }

  async getRecentIncidents(days) {
    try {
      return await Incident.getRecentIncidents(days);
    } catch (error) {
      throw new Error(`Error al obtener incidentes recientes: ${error.message}`);
    }
  }
}

module.exports = new IncidentService();