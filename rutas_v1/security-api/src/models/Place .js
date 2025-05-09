// This is a basic example using a placeholder 'db' object
// You would replace 'db' with your actual database connection pool or client
/**
 * models/Place.js
 * Modelo para lugares (POIs) en el sistema de geocoding
 */
 
const { pool } = require('../config/db'); 
const AppError = require('../utils/errorHandler');

class Place {
  /**
   * Busca lugares por nombre o palabras clave
   * @param {string} query - Texto de búsqueda
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Promesa con array de lugares encontrados
   */
  static async search(query, limit = 10) {
    if (!query || query.trim().length < 2) {
      throw new AppError('El término de búsqueda debe tener al menos 2 caracteres', 400);
    }
    
    try {
      const { rows } = await pool.query(
        'SELECT * FROM geocoding.search_places($1, $2)',
        [query.trim(), limit]
      );
      
      return rows;
    } catch (error) {
      throw new AppError(`Error al buscar lugares: ${error.message}`, 500);
    }
  }
  
  /**
   * Encuentra lugares cercanos a un punto
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @param {number} radius - Radio en metros
   * @param {number} limit - Número máximo de resultados
   * @param {Array<string>} categories - Categorías de lugares a buscar
   * @returns {Promise<Array>} - Promesa con lugares cercanos
   */
  static async findNearby(lat, lng, radius = 500, limit = 10, categories = null) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM geocoding.nearby_places($1, $2, $3, $4, $5)',
        [lat, lng, radius, limit, categories]
      );
      
      return rows;
    } catch (error) {
      throw new AppError(`Error al buscar lugares cercanos: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene un lugar por su ID
   * @param {number} id - ID del lugar
   * @returns {Promise<Object>} - Promesa con datos del lugar
   */
  static async findById(id) {
    try {
      const { rows } = await pool.query(
        `SELECT 
          id, name, alternative_names, category, subcategory,
          ST_Y(geom::geometry) AS latitude,
          ST_X(geom::geometry) AS longitude,
          address, district, is_verified, search_priority,
          created_at, updated_at
        FROM geocoding.places
        WHERE id = $1`,
        [id]
      );
      
      if (rows.length === 0) {
        throw new AppError('Lugar no encontrado', 404);
      }
      
      return rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error al obtener lugar: ${error.message}`, 500);
    }
  }
  
  /**
   * Crea un nuevo lugar
   * @param {Object} placeData - Datos del lugar
   * @returns {Promise<Object>} - Promesa con el lugar creado
   */
  static async create(placeData) {
    const { 
      name, alternative_names, category, subcategory, 
      latitude, longitude, address, district, search_priority = 10 
    } = placeData;
    
    // Validar datos obligatorios
    if (!name || !latitude || !longitude) {
      throw new AppError('Nombre y coordenadas son obligatorios', 400);
    }
    
    try {
      const { rows } = await pool.query(
        `INSERT INTO geocoding.places (
          name, alternative_names, category, subcategory, 
          geom, address, district, search_priority
        )
        VALUES (
          $1, $2, $3, $4, 
          ST_SetSRID(ST_MakePoint($6, $5), 4326), 
          $7, $8, $9
        )
        RETURNING 
          id, name, alternative_names, category, subcategory,
          $5 AS latitude, $6 AS longitude,
          address, district, search_priority, created_at`,
        [
          name, 
          alternative_names, 
          category, 
          subcategory, 
          latitude, 
          longitude, 
          address, 
          district, 
          search_priority
        ]
      );
      
      return rows[0];
    } catch (error) {
      throw new AppError(`Error al crear lugar: ${error.message}`, 500);
    }
  }
  
  /**
   * Actualiza un lugar existente
   * @param {number} id - ID del lugar a actualizar
   * @param {Object} placeData - Datos actualizados
   * @returns {Promise<Object>} - Promesa con el lugar actualizado
   */
  static async update(id, placeData) {
    // Verificar que el lugar existe
    await Place.findById(id);
    
    const { 
      name, alternative_names, category, subcategory, 
      latitude, longitude, address, district, search_priority 
    } = placeData;
    
    try {
      let query, params;
      
      // Si se actualizan las coordenadas
      if (latitude !== undefined && longitude !== undefined) {
        query = `
          UPDATE geocoding.places 
          SET 
            name = COALESCE($1, name),
            alternative_names = COALESCE($2, alternative_names),
            category = COALESCE($3, category),
            subcategory = COALESCE($4, subcategory),
            geom = CASE 
              WHEN $5 IS NOT NULL AND $6 IS NOT NULL 
              THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)
              ELSE geom 
            END,
            address = COALESCE($7, address),
            district = COALESCE($8, district),
            search_priority = COALESCE($9, search_priority),
            updated_at = NOW()
          WHERE id = $10
          RETURNING 
            id, name, alternative_names, category, subcategory,
            ST_Y(geom::geometry) AS latitude,
            ST_X(geom::geometry) AS longitude,
            address, district, search_priority, updated_at
        `;
        
        params = [
          name, alternative_names, category, subcategory, 
          latitude, longitude, address, district, 
          search_priority, id
        ];
      } else {
        // Si no se actualizan las coordenadas
        query = `
          UPDATE geocoding.places 
          SET 
            name = COALESCE($1, name),
            alternative_names = COALESCE($2, alternative_names),
            category = COALESCE($3, category),
            subcategory = COALESCE($4, subcategory),
            address = COALESCE($5, address),
            district = COALESCE($6, district),
            search_priority = COALESCE($7, search_priority),
            updated_at = NOW()
          WHERE id = $8
          RETURNING 
            id, name, alternative_names, category, subcategory,
            ST_Y(geom::geometry) AS latitude,
            ST_X(geom::geometry) AS longitude,
            address, district, search_priority, updated_at
        `;
        
        params = [
          name, alternative_names, category, subcategory, 
          address, district, search_priority, id
        ];
      }
      
      const { rows } = await pool.query(query, params);
      
      return rows[0];
    } catch (error) {
      throw new AppError(`Error al actualizar lugar: ${error.message}`, 500);
    }
  }
  
  /**
   * Elimina un lugar
   * @param {number} id - ID del lugar a eliminar
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  static async delete(id) {
    // Verificar que el lugar existe
    await Place.findById(id);
    
    try {
      await pool.query(
        'DELETE FROM geocoding.places WHERE id = $1',
        [id]
      );
      
      return true;
    } catch (error) {
      throw new AppError(`Error al eliminar lugar: ${error.message}`, 500);
    }
  }
}

module.exports = Place;