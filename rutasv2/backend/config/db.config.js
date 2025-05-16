require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'security_db',
    password: process.env.DB_PASSWORD || '85857855pepito',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

module.exports = dbConfig;