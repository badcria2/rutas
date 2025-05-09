/**
 * models/Geocoding.js
 * Modelo para operaciones de geocodificación
 */

const { pool } = require('../config/db'); 
const AppError = require('../utils/errorHandler');

class Geocoding {
  /**
   * Geocodifica una dirección o nombre de lugar
   * @param {string} address - Dirección o lugar a geocodificar
   * @returns {Promise<Array>} - Resultados de geocodificación
   */
  static async geocode(address) {
    if (!address || address.trim().length < 3) {
      throw new AppError('La dirección debe tener al menos 3 caracteres', 400);
    }
    
    try {
      const { rows } = await pool.query(
        'SELECT * FROM geocoding.geocode($1)',
        [address.trim()]
      );
      
      return rows;
    } catch (error) {
      throw new AppError(`Error al geocodificar dirección: ${error.message}`, 500);
    }
  }
  
  /**
   * Busca calles por nombre
   * @param {string} query - Nombre o parte del nombre de la calle
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Calles encontradas
   */
  static async searchStreets(query, limit = 10) {
    if (!query || query.trim().length < 2) {
      throw new AppError('El término de búsqueda debe tener al menos 2 caracteres', 400);
    }
    
    try {
      const { rows } = await pool.query(
        'SELECT * FROM geocoding.search_streets($1, $2)',
        [query.trim(), limit]
      );
      
      return rows;
    } catch (error) {
      throw new AppError(`Error al buscar calles: ${error.message}`, 500);
    }
  }
  
  /**
   * Función de geocodificación inversa (coordenadas a dirección)
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Promise<Object>} - Información de la ubicación
   */
  static async reverseGeocode(lat, lng) {
    try {
      // 1. Buscar el distrito
      const districtQuery = {
        text: 'SELECT * FROM geocoding.find_district($1, $2)',
        values: [lat, lng]
      };
      
      const districtResult = await pool.query(districtQuery);
      const district = districtResult.rows.length > 0 ? districtResult.rows[0] : null;
      
      // 2. Buscar la calle más cercana
      const streetQuery = {
        text: `
          SELECT 
            id, name, type, district, 
            ST_Distance(
              geom::geography, 
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
            ) AS distance
          FROM 
            geocoding.streets
          WHERE 
            ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              100 -- 100 metros de radio
            )
          ORDER BY 
            distance ASC
          LIMIT 1
        `,
        values: [lat, lng]
      };
      
      const streetResult = await pool.query(streetQuery);
      const street = streetResult.rows.length > 0 ? streetResult.rows[0] : null;
      
      // 3. Buscar los lugares cercanos más relevantes
      const placesQuery = {
        text: `
          SELECT 
            id, name, category, subcategory,
            ST_Distance(
              geom::geography, 
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
            ) AS distance,
            ST_Y(geom::geometry) AS latitude,
            ST_X(geom::geometry) AS longitude,
            address
          FROM 
            geocoding.places
          WHERE 
            ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              300 -- 300 metros de radio
            )
          ORDER BY 
            search_priority ASC,
            distance ASC
          LIMIT 5
        `,
        values: [lat, lng]
      };
      
      const placesResult = await pool.query(placesQuery);
      const places = placesResult.rows;
      
      // Construir un resultado combinado
      return {
        location: {
          latitude: lat,
          longitude: lng,
          district: district ? district.district_name : null,
          security_level: district ? district.security_level : null
        },
        street: street,
        places: places
      };
    } catch (error) {
      throw new AppError(`Error en geocodificación inversa: ${error.message}`, 500);
    }
  }
  
  /**
   * Obtiene una sugerencia de dirección basada en texto parcial
   * @param {string} partial - Texto parcial de dirección
   * @param {number} limit - Número máximo de sugerencias
   * @returns {Promise<Array>} - Sugerencias de direcciones
   */
  static async suggestAddress(partial, limit = 5) {
    if (!partial || partial.trim().length < 2) {
      throw new AppError('El texto debe tener al menos 2 caracteres', 400);
    }
    
    try {
      // Buscar en lugares primero
      const placesQuery = {
        text: `
          SELECT 
            name AS suggestion,
            'place' AS type,
            ST_Y(geom::geometry) AS latitude,
            ST_X(geom::geometry) AS longitude,
            district,
            similarity(name, $1) AS score
          FROM 
            geocoding.places
          WHERE 
            similarity(name, $1) > 0.4 OR
            name ILIKE '%' || $1 || '%'
          ORDER BY 
            search_priority ASC,
            similarity(name, $1) DESC
          LIMIT $2
        `,
        values: [partial.trim(), limit]
      };
      
      // Buscar en calles
      const streetsQuery = {
        text: `
          SELECT 
            type || ' ' || name AS suggestion,
            'street' AS type,
            NULL AS latitude,
            NULL AS longitude,
            district,
            similarity(name, $1) AS score
          FROM 
            geocoding.streets
          WHERE 
            similarity(name, $1) > 0.4 OR
            name ILIKE '%' || $1 || '%'
          ORDER BY 
            similarity(name, $1) DESC
          LIMIT $2
        `,
        values: [partial.trim(), limit]
      };
      
      // Ejecutar ambas consultas en paralelo
      const [placesResult, streetsResult] = await Promise.all([
        pool.query(placesQuery),
        pool.query(streetsQuery)
      ]);
      
      // Combinar y ordenar resultados
      const combined = [
        ...placesResult.rows,
        ...streetsResult.rows
      ].sort((a, b) => b.score - a.score).slice(0, limit);
      
      return combined;
    } catch (error) {
      throw new AppError(`Error al sugerir direcciones: ${error.message}`, 500);
    }
  }
}

module.exports = Geocoding;