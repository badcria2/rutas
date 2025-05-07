// src/models/securityPoint.js
const db = require('../config/db');

class SecurityPoint {
  static async getAll() {
    const query = 'SELECT * FROM security_points ORDER BY name';
    const { rows } = await db.query(query);
    return rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM security_points WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async create(securityPoint) {
    const { name, latitude, longitude, type, security_level } = securityPoint;
    const query = `
      INSERT INTO security_points (name, latitude, longitude, type, security_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(query, [name, latitude, longitude, type, security_level]);
    return rows[0];
  }

  static async update(id, securityPoint) {
    const { name, latitude, longitude, type, security_level } = securityPoint;
    const query = `
      UPDATE security_points
      SET name = $1, latitude = $2, longitude = $3, type = $4, security_level = $5
      WHERE id = $6
      RETURNING *
    `;
    const { rows } = await db.query(query, [name, latitude, longitude, type, security_level, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM security_points WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getByType(type) {
    const query = 'SELECT * FROM security_points WHERE type = $1 ORDER BY name';
    const { rows } = await db.query(query, [type]);
    return rows;
  }

  static async getBySecurityLevel(level) {
    const query = 'SELECT * FROM security_points WHERE security_level = $1 ORDER BY name';
    const { rows } = await db.query(query, [level]);
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
      FROM security_points
      HAVING (
        6371 * acos(
          cos(radians($1)) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(latitude))
        )
      ) < $3
      ORDER BY distance
    `;
    const { rows } = await db.query(query, [lat, lng, radiusKm]);
    return rows;
  }
}

module.exports = SecurityPoint;