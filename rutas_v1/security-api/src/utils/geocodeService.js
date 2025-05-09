// src/utils/geocodeService.js
const db = require('../config/db');

// Coordenadas predefinidas de distritos y lugares en Lima
const placeCoordinates = {
  'miraflores': [-12.1219, -77.0297],
  'san isidro': [-12.0977, -77.0365],
  'surco': [-12.1450, -76.9917],
  'barranco': [-12.1495, -77.0219],
  'la molina': [-12.0867, -76.9055],
  'san borja': [-12.1019, -76.9975],
  'jesús maría': [-12.0705, -77.0517],
  'lince': [-12.0833, -77.0333],
  'san miguel': [-12.0789, -77.0825],
  'magdalena': [-12.0889, -77.0717],
  'pueblo libre': [-12.0717, -77.0633],
  'lima centro': [-12.0464, -77.0428],
  'rimac': [-12.0292, -77.0428],
  'san juan de lurigancho': [-12.0031, -77.0081],
  'villa el salvador': [-12.2136, -76.9319],
  'san juan de miraflores': [-12.1550, -76.9700],
  'la victoria': [-12.0650, -77.0150],
  'ate': [-12.0258, -76.9178],
  'callao': [-12.0500, -77.1200],
  'jockey plaza': [-12.0847, -76.9750],
  'parque kennedy': [-12.1219, -77.0297],
  'plaza san miguel': [-12.0769, -77.0825],
  'aeropuerto jorge chávez': [-12.0219, -77.1144],
  'universidad de lima': [-12.0836, -76.9700],
  'universidad católica': [-12.0711, -77.0796],
  'plaza de armas': [-12.0464, -77.0329],
  'estadio nacional': [-12.0672, -77.0333],
  'megaplaza': [-11.9958, -77.0600],
  'wong la molina': [-12.0867, -76.9150],
  'real plaza salaverry': [-12.0894, -77.0522]
};

// Coordenadas por defecto para Lima
const LIMA_CENTER = [-12.0464, -77.0428];

class GeocodeService {
  /**
   * Convierte un nombre de lugar en coordenadas
   * @param {string} placeName - Nombre del lugar a geocodificar
   * @returns {Promise<Array<number>>} - Arreglo [latitud, longitud]
   */
  async geocode(placeName) {
    try {
      if (!placeName) {
        return LIMA_CENTER;
      }

      const normalizedName = placeName.toLowerCase().trim();
      
      // Buscar en datos predefinidos
      if (placeCoordinates[normalizedName]) {
        return placeCoordinates[normalizedName];
      }
      
      // Buscar en la base de datos (distritos)
      const districtQuery = `
        SELECT latitude, longitude FROM districts 
        WHERE LOWER(name) = $1
      `;
      const districtResult = await db.query(districtQuery, [normalizedName]);
      
      if (districtResult.rows.length > 0) {
        const { latitude, longitude } = districtResult.rows[0];
        return [parseFloat(latitude), parseFloat(longitude)];
      }
      
      // Buscar coincidencias parciales
      const partialQuery = `
        SELECT name, latitude, longitude FROM districts 
        WHERE LOWER(name) LIKE $1
        LIMIT 1
      `;
      const partialResult = await db.query(partialQuery, [`%${normalizedName}%`]);
      
      if (partialResult.rows.length > 0) {
        const { latitude, longitude } = partialResult.rows[0];
        return [parseFloat(latitude), parseFloat(longitude)];
      }
      
      // Si no se encuentra, devolver centro de Lima
      return LIMA_CENTER;
    } catch (error) {
      console.error('Error en geocodificación:', error);
      return LIMA_CENTER;
    }
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * @param {Array<number>} point1 - [latitud, longitud] del primer punto
   * @param {Array<number>} point2 - [latitud, longitud] del segundo punto
   * @returns {number} - Distancia en kilómetros
   */
  calculateDistance(point1, point2) {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;
    
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1); 
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  /**
   * Convierte grados a radianes
   * @param {number} degrees - Valor en grados
   * @returns {number} - Valor en radianes
   */
  toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}

module.exports = new GeocodeService();