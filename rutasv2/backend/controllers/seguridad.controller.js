const db = require('../db/db');

// Controlador para obtener puntos de seguridad
const getPuntosSeguridad = async (req, res) => {
    try {
        // Extraer parámetros de consulta o usar valores por defecto (centro de Lima)
        const lat = parseFloat(req.query.lat) || -12.0464;
        const lng = parseFloat(req.query.lng) || -77.0428;
        const radio = parseInt(req.query.radio) || 1000; // Radio en metros
        
        // Obtener los puntos de seguridad de la base de datos
        const puntos = await db.getPuntosSeguridad(lat, lng, radio);
        
        // Responder con los puntos encontrados
        res.json(puntos);
    } catch (error) {
        console.error('Error al obtener puntos de seguridad:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

module.exports = {
    getPuntosSeguridad
};