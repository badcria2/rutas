/**
 * db.js
 * Funciones de ayuda para interactuar con la base de datos PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'security_db',
    password: '85857855pepito',
    port: process.env.DB_PORT || 5432,
});


// Verificar la conexión a la base de datos
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err);
    } else {
        console.log('Conexión a PostgreSQL establecida');
    }
});

/**
 * Obtiene todos los puntos de seguridad dentro de un radio
 * @param {number} lat - Latitud del centro
 * @param {number} lng - Longitud del centro
 * @param {number} radiusMeters - Radio en metros
 * @returns {Promise<Array>} - Array de puntos de seguridad
 */
async function getPuntosSeguridad(lat, lng, radiusMeters = 500) {
    try {
        // Consulta usando PostGIS para encontrar puntos dentro de un radio
        const query = `
            SELECT 
                id, 
                nombre, 
                tipo, 
                descripcion, 
                ST_X(ubicacion::geometry) as lng, 
                ST_Y(ubicacion::geometry) as lat,
                ST_Distance(
                    ubicacion::geography, 
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                ) as distancia
            FROM puntos_seguridad
            WHERE ST_DWithin(
                ubicacion::geography,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                $3
            )
            ORDER BY distancia ASC;
        `;

        const result = await pool.query(query, [lat, lng, radiusMeters]);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener puntos de seguridad:', error);
        throw error;
    }
}

/**
 * Obtiene todos los incidentes reportados dentro de un radio
 * @param {number} lat - Latitud del centro
 * @param {number} lng - Longitud del centro
 * @param {number} radiusMeters - Radio en metros
 * @returns {Promise<Array>} - Array de incidentes
 */
async function getIncidentes(lat, lng, radiusMeters = 500) {
    try {
        // Consulta usando PostGIS para encontrar incidentes dentro de un radio
        const query = `
            SELECT 
                id, 
                tipo, 
                descripcion, 
                fecha, 
                ST_X(ubicacion::geometry) as lng, 
                ST_Y(ubicacion::geometry) as lat,
                ST_Distance(
                    ubicacion::geography, 
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                ) as distancia
            FROM incidentes
            WHERE ST_DWithin(
                ubicacion::geography,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                $3
            )
            ORDER BY fecha DESC, distancia ASC;
        `;

        const result = await pool.query(query, [lat, lng, radiusMeters]);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener incidentes:', error);
        throw error;
    }
}

/**
 * Obtiene puntos de seguridad e incidentes a lo largo de una línea (ruta)
 * @param {Array} coordinates - Array de coordenadas [lng, lat] que forman la ruta
 * @param {number} bufferMeters - Buffer en metros a cada lado de la línea
 * @returns {Promise<Object>} - Objeto con puntos de seguridad e incidentes
 */
/**
* Obtiene puntos de seguridad e incidentes a lo largo de una línea (ruta)
* @param {Array} coordinates - Array de coordenadas [lng, lat] que forman la ruta
* @param {number} bufferMeters - Buffer en metros a cada lado de la línea
* @returns {Promise<Object>} - Objeto con puntos de seguridad e incidentes
*/
async function getPuntosEnRuta(coordinates, bufferMeters = 200) {
    try {
        // Verificar que coordinates sea un array válido
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
            console.log('Coordenadas no válidas:', coordinates);
            // Devolver objetos vacíos en lugar de generar error
            return {
                puntosSeguridad: [],
                incidentes: []
            };
        }
 

        // Consulta para obtener puntos de seguridad cerca de la ruta
        // Crear el formato de LINESTRING
        const lineString = `LINESTRING(${coordinates.reduce((acc, _, i) => {
            if (i % 2 === 0 && coordinates[i + 1] !== undefined) {
                acc.push(`${coordinates[i]} ${coordinates[i + 1]}`);
            }
            return acc;
        }, []).join(', ')})`;

        console.log('LINESTRING generado:', lineString);

        // Consulta para obtener puntos de seguridad cerca de la ruta
        const seguridadQuery = `
            SELECT 
                id, 
                nombre, 
                tipo, 
                descripcion, 
                ST_X(ubicacion::geometry) as lng, 
                ST_Y(ubicacion::geometry) as lat,
                ST_Distance(
                    ubicacion::geography, 
                    ST_GeomFromText($1, 4326)::geography
                ) as distancia
            FROM puntos_seguridad
            WHERE ST_DWithin(
                ubicacion::geography,
                ST_GeomFromText($1, 4326)::geography,
                $2
            )
            ORDER BY distancia ASC;
        `;

        console.log('Consulta SQL de seguridad:', seguridadQuery);
        console.log('Parámetros de seguridad:', [lineString, bufferMeters]);

        // Consulta para obtener incidentes cerca de la ruta
        const incidentesQuery = `
            SELECT 
                id, 
                tipo, 
                descripcion, 
                fecha, 
                ST_X(ubicacion::geometry) as lng, 
                ST_Y(ubicacion::geometry) as lat,
                ST_Distance(
                    ubicacion::geography, 
                    ST_GeomFromText($1, 4326)::geography
                ) as distancia
            FROM incidentes
            WHERE ST_DWithin(
                ubicacion::geography,
                ST_GeomFromText($1, 4326)::geography,
                $2
            )
            ORDER BY fecha DESC, distancia ASC;
        `;

        console.log('Consulta SQL de incidentes:', incidentesQuery);
        console.log('Parámetros de incidentes:', [lineString, bufferMeters]);

        // Ejecutar ambas consultas en paralelo
        const [seguridadResult, incidentesResult] = await Promise.all([
            pool.query(seguridadQuery, [lineString, bufferMeters]),
            pool.query(incidentesQuery, [lineString, bufferMeters])
        ]);


        return {
            puntosSeguridad: seguridadResult.rows,
            incidentes: incidentesResult.rows
        };
    } catch (error) {
        console.error('Error al obtener puntos en la ruta:', error);
        console.error('Detalles del error:', error.detail);  // Imprime más detalles

        // Devolver objetos vacíos en caso de error
        return {
            puntosSeguridad: [],
            incidentes: []
        };
    }
}
/**
 * Calcula el índice de seguridad para una ruta basado en los puntos cercanos
 * @param {Array} coordinates - Array de coordenadas [lng, lat] que forman la ruta
 * @returns {Promise<number>} - Índice de seguridad (0-100)
 */

/**
 * Calcula el índice de seguridad para una ruta basado en los puntos cercanos
 * @param {Array} coordinates - Array de coordenadas [lng, lat] que forman la ruta
 * @returns {Promise<number>} - Índice de seguridad (0-100)
 */
async function calcularIndiceSeguridad(coordinates) {
    try {
        // Verificar que coordinates sea un array válido
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
            console.log('Coordenadas no válidas para calcular índice de seguridad:', coordinates);
            return 75; // Valor por defecto si no hay coordenadas válidas
        }

        // Obtener puntos cerca de la ruta
        const { puntosSeguridad, incidentes } = await getPuntosEnRuta(coordinates, 300);

        // Base inicial de seguridad (75/100)
        let indiceSeguridad = 75;

        // Factores que mejoran la seguridad
        const factoresPositivos = {
            comisaria: 5,    // Cada comisaría cercana suma 5 puntos
            serenazgo: 3,    // Cada punto de serenazgo suma 3 puntos
            hospital: 2,     // Cada hospital suma 2 puntos
            iluminacion: 1   // Cada punto de iluminación suma 1 punto
        };

        // Factores que disminuyen la seguridad
        const factoresNegativos = {
            robo: -8,        // Cada incidente de robo resta 8 puntos
            acoso: -5,       // Cada incidente de acoso resta 5 puntos
            accidente: -3,   // Cada accidente resta 3 puntos
            otro: -2         // Otros incidentes restan 2 puntos
        };

        // Calcular impacto de puntos de seguridad
        puntosSeguridad.forEach(punto => {
            if (factoresPositivos[punto.tipo]) {
                // El impacto disminuye con la distancia
                const factor = factoresPositivos[punto.tipo] * (1 - (punto.distancia / 300));
                indiceSeguridad += factor;
            }
        });

        // Calcular impacto de incidentes
        incidentes.forEach(incidente => {
            if (factoresNegativos[incidente.tipo]) {
                // El impacto disminuye con la distancia y con el tiempo
                const diasPasados = Math.floor((new Date() - new Date(incidente.fecha)) / (1000 * 60 * 60 * 24));
                const factorTiempo = Math.max(0, 1 - (diasPasados / 30)); // Después de 30 días el impacto es 0
                const factorDistancia = 1 - (incidente.distancia / 300);

                const factor = factoresNegativos[incidente.tipo] * factorTiempo * factorDistancia;
                indiceSeguridad += factor; // Suma porque el factor ya es negativo
            }
        });

        // Limitar el índice entre 0 y 100
        return Math.max(0, Math.min(100, Math.round(indiceSeguridad)));
    } catch (error) {
        console.error('Error al calcular índice de seguridad:', error);
        return 75; // Valor por defecto en caso de error
    }
}

/**
 * Registra un nuevo incidente en la base de datos
 * @param {Object} incidenteData - Datos del incidente
 * @returns {Promise<Object>} - Incidente creado
 */
async function registrarIncidente(incidenteData) {
    try {
        const { tipo, descripcion, fecha, ubicacion } = incidenteData;

        const query = `
            INSERT INTO incidentes (tipo, descripcion, fecha, ubicacion)
            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($5, $4), 4326))
            RETURNING id, tipo, descripcion, fecha, 
                ST_X(ubicacion::geometry) as lng, 
                ST_Y(ubicacion::geometry) as lat;
        `;

        const result = await pool.query(query, [
            tipo,
            descripcion,
            fecha,
            ubicacion.lat,
            ubicacion.lng
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Error al registrar incidente:', error);
        throw error;
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    getPuntosSeguridad,
    getIncidentes,
    getPuntosEnRuta,
    calcularIndiceSeguridad,
    registrarIncidente
};