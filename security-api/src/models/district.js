// src/models/district.js
const db = require('../config/db');

class District {
  static async getAll() {
    const query = 'SELECT * FROM districts ORDER BY name';
    const { rows } = await db.query(query);
    return rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM districts WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getByName(name) {
    const query = 'SELECT * FROM districts WHERE LOWER(name) = LOWER($1)';
    const { rows } = await db.query(query, [name]);
    return rows[0];
  }

  static async create(district) {
    const { name, security_level, latitude, longitude } = district;
    const query = `
      INSERT INTO districts (name, security_level, latitude, longitude)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(query, [name, security_level, latitude, longitude]);
    return rows[0];
  }

  static async update(id, district) {
    const { name, security_level, latitude, longitude } = district;
    const query = `
      UPDATE districts
      SET name = $1, security_level = $2, latitude = $3, longitude = $4
      WHERE id = $5
      RETURNING *
    `;
    const { rows } = await db.query(query, [name, security_level, latitude, longitude, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM districts WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getDistrictsSortedBySecurity(order = 'DESC') {
    const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const query = `
      SELECT * FROM districts
      ORDER BY security_level ${validOrder}, name
    `;
    const { rows } = await db.query(query);
    return rows;
  }
}

module.exports = District;