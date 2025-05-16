/**
 * db.js
 * Funciones de ayuda para interactuar con la base de datos PostgreSQL
 */

const { Pool } = require('pg');
const dbConfig = require('../config/db.config');
require('dotenv').config();

// Verificamos si estamos en un entorno local o de producción para configurar SSL
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    ...dbConfig,
    // Deshabilitar SSL para desarrollo local, configurar para producción
    ssl: isProduction ? { rejectUnauthorized: false } : false
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

/**
 * Obtiene todas las rutas favoritas de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} - Array de rutas favoritas
 */
async function getRutasFavoritas(usuarioId) {
    try {
        const query = `
            SELECT 
                id,
                nombre,
                origen_nombre,
                origen_lat,
                origen_lng,
                destino_nombre,
                destino_lat,
                destino_lng,
                modo_transporte,
                fecha_creacion
            FROM rutas_favoritas
            WHERE usuario_id = $1
            ORDER BY fecha_creacion DESC
        `;
        
        const result = await pool.query(query, [usuarioId]);
        
        // Formatear el resultado para la API
        return result.rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            origen: {
                nombre: row.origen_nombre,
                coordenadas: {
                    lat: row.origen_lat,
                    lng: row.origen_lng
                }
            },
            destino: {
                nombre: row.destino_nombre,
                coordenadas: {
                    lat: row.destino_lat,
                    lng: row.destino_lng
                }
            },
            modoTransporte: row.modo_transporte,
            fechaCreacion: row.fecha_creacion
        }));
    } catch (error) {
        console.error('Error al obtener rutas favoritas:', error);
        throw error;
    }
}

/**
 * Obtiene una ruta favorita específica por su ID
 * @param {number} rutaId - ID de la ruta favorita
 * @returns {Promise<Object|null>} - Ruta favorita o null si no existe
 */
async function getRutaFavoritaPorId(rutaId) {
    try {
        const query = `
            SELECT 
                id,
                nombre,
                origen_nombre,
                origen_lat,
                origen_lng,
                destino_nombre,
                destino_lat,
                destino_lng,
                modo_transporte,
                fecha_creacion
            FROM rutas_favoritas
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [rutaId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        
        // Formatear el resultado para la API
        return {
            id: row.id,
            nombre: row.nombre,
            origen: {
                nombre: row.origen_nombre,
                coordenadas: {
                    lat: row.origen_lat,
                    lng: row.origen_lng
                }
            },
            destino: {
                nombre: row.destino_nombre,
                coordenadas: {
                    lat: row.destino_lat,
                    lng: row.destino_lng
                }
            },
            modoTransporte: row.modo_transporte,
            fechaCreacion: row.fecha_creacion
        };
    } catch (error) {
        console.error('Error al obtener ruta favorita por ID:', error);
        throw error;
    }
}

/**
 * Guarda una nueva ruta favorita
 * @param {Object} rutaData - Datos de la ruta favorita
 * @returns {Promise<Object>} - Ruta favorita guardada
 */
async function guardarRutaFavorita(rutaData) {
    try {
        const {
            usuario_id,
            nombre,
            origen_nombre,
            origen_lat,
            origen_lng,
            destino_nombre,
            destino_lat,
            destino_lng,
            modo_transporte,
            fecha_creacion
        } = rutaData;
        
        const query = `
            INSERT INTO rutas_favoritas (
                usuario_id,
                nombre,
                origen_nombre,
                origen_lat,
                origen_lng,
                destino_nombre,
                destino_lat,
                destino_lng,
                modo_transporte,
                fecha_creacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING 
                id,
                nombre,
                origen_nombre,
                origen_lat,
                origen_lng,
                destino_nombre,
                destino_lat,
                destino_lng,
                modo_transporte,
                fecha_creacion
        `;
        
        const result = await pool.query(query, [
            usuario_id,
            nombre,
            origen_nombre,
            origen_lat,
            origen_lng,
            destino_nombre,
            destino_lat,
            destino_lng,
            modo_transporte,
            fecha_creacion
        ]);
        
        const row = result.rows[0];
        
        // Formatear el resultado para la API
        return {
            id: row.id,
            nombre: row.nombre,
            origen: {
                nombre: row.origen_nombre,
                coordenadas: {
                    lat: row.origen_lat,
                    lng: row.origen_lng
                }
            },
            destino: {
                nombre: row.destino_nombre,
                coordenadas: {
                    lat: row.destino_lat,
                    lng: row.destino_lng
                }
            },
            modoTransporte: row.modo_transporte,
            fechaCreacion: row.fecha_creacion
        };
    } catch (error) {
        console.error('Error al guardar ruta favorita:', error);
        throw error;
    }
}

/**
 * Actualiza una ruta favorita existente
 * @param {number} rutaId - ID de la ruta favorita
 * @param {Object} rutaData - Nuevos datos de la ruta favorita
 * @returns {Promise<Object>} - Ruta favorita actualizada
 */
async function actualizarRutaFavorita(rutaId, rutaData) {
    try {
        const {
            nombre,
            origen_nombre,
            origen_lat,
            origen_lng,
            destino_nombre,
            destino_lat,
            destino_lng,
            modo_transporte
        } = rutaData;
        
        const query = `
            UPDATE rutas_favoritas
            SET 
                nombre = $2,
                origen_nombre = $3,
                origen_lat = $4,
                origen_lng = $5,
                destino_nombre = $6,
                destino_lat = $7,
                destino_lng = $8,
                modo_transporte = $9
            WHERE id = $1
            RETURNING 
                id,
                nombre,
                origen_nombre,
                origen_lat,
                origen_lng,
                destino_nombre,
                destino_lat,
                destino_lng,
                modo_transporte,
                fecha_creacion
        `;
        
        const result = await pool.query(query, [
            rutaId,
            nombre,
            origen_nombre,
            origen_lat,
            origen_lng,
            destino_nombre,
            destino_lat,
            destino_lng,
            modo_transporte
        ]);
        
        if (result.rows.length === 0) {
            throw new Error('Ruta favorita no encontrada');
        }
        
        const row = result.rows[0];
        
        // Formatear el resultado para la API
        return {
            id: row.id,
            nombre: row.nombre,
            origen: {
                nombre: row.origen_nombre,
                coordenadas: {
                    lat: row.origen_lat,
                    lng: row.origen_lng
                }
            },
            destino: {
                nombre: row.destino_nombre,
                coordenadas: {
                    lat: row.destino_lat,
                    lng: row.destino_lng
                }
            },
            modoTransporte: row.modo_transporte,
            fechaCreacion: row.fecha_creacion
        };
    } catch (error) {
        console.error('Error al actualizar ruta favorita:', error);
        throw error;
    }
}

/**
 * Elimina una ruta favorita
 * @param {number} rutaId - ID de la ruta favorita
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarRutaFavorita(rutaId) {
    try {
        const query = `
            DELETE FROM rutas_favoritas
            WHERE id = $1
            RETURNING id
        `;
        
        const result = await pool.query(query, [rutaId]);
        
        if (result.rows.length === 0) {
            throw new Error('Ruta favorita no encontrada');
        }
        
        return true;
    } catch (error) {
        console.error('Error al eliminar ruta favorita:', error);
        throw error;
    }
}

// Asegúrate de exportar todas las funciones
module.exports = {
    query: (text, params) => pool.query(text, params),
    getPuntosSeguridad,
    getIncidentes,
    getPuntosEnRuta,
    calcularIndiceSeguridad,
    registrarIncidente,
    getRutasFavoritas,
    getRutaFavoritaPorId,
    guardarRutaFavorita,
    actualizarRutaFavorita,
    eliminarRutaFavorita
};