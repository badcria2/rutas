// src/models/incident.js
const db = require('../config/db');

class Incident {
  static async getAll() {
    const query = 'SELECT * FROM incidents ORDER BY date DESC';
    const { rows } = await db.query(query);
    return rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM incidents WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async create(incident) {
    const { type, description, latitude, longitude, date } = incident;
    const query = `
      INSERT INTO incidents (type, description, latitude, longitude, date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(query, [type, description, latitude, longitude, date]);
    return rows[0];
  }

  static async update(id, incident) {
    const { type, description, latitude, longitude, date } = incident;
    const query = `
      UPDATE incidents
      SET type = $1, description = $2, latitude = $3, longitude = $4, date = $5
      WHERE id = $6
      RETURNING *
    `;
    const { rows } = await db.query(query, [type, description, latitude, longitude, date, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM incidents WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getByType(type) {
    const query = 'SELECT * FROM incidents WHERE type = $1 ORDER BY date DESC';
    const { rows } = await db.query(query, [type]);
    return rows;
  }

  static async getByDateRange(startDate, endDate) {
    const query = 'SELECT * FROM incidents WHERE date BETWEEN $1 AND $2 ORDER BY date DESC';
    const { rows } = await db.query(query, [startDate, endDate]);
    return rows;
  }

  static async getByProximity(lat, lng, radiusKm = 1) {
    // Fórmula Haversine para calcular distancia en kilómetros
    const query = `
      SELECT *, 
      (
        6371 * acos(
          cos(radians($1)) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(latitude))
        )
      ) AS distance
      FROM incidents
      HAVING (
        6371 * acos(
          cos(radians($1)) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(latitude))
        )
      ) < $3
      ORDER BY distance, date DESC
    `;
    const { rows } = await db.query(query, [lat, lng, radiusKm]);
    return rows;
  }

  static async getRecentIncidents(days = 7) {
    const query = `
      SELECT * FROM incidents 
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days' 
      ORDER BY date DESC
    `;
    const { rows } = await db.query(query);
    return rows;
  }
}

module.exports = Incident;