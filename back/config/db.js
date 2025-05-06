const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rutas_seguras',
  password: 'tu_contraseña',
  port: 5432,
});

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL establecida con éxito');
    client.release();
    return true;
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err);
    throw err;
  }
};

// Función para realizar consultas a la base de datos
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Error en la consulta:', err);
    throw err;
  }
};

module.exports = {
  connectDB,
  query,
  pool
};