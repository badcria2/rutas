const db = require('../db/db');

// Obtener incidentes reportados cercanos a una ubicación
const getIncidentes = async (req, res) => {
    try {
        // Extraer parámetros de consulta o usar valores por defecto
        const lat = parseFloat(req.query.lat) || -12.0464;
        const lng = parseFloat(req.query.lng) || -77.0428;
        const radio = parseInt(req.query.radio) || 1000; // Radio en metros
        
        // Obtener los incidentes de la base de datos
        const incidentes = await db.getIncidentes(lat, lng, radio);
        
        // Responder con los incidentes encontrados
        res.json(incidentes);
    } catch (error) {
        console.error('Error al obtener incidentes:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

// Registrar un nuevo incidente
const registrarIncidente = async (req, res) => {
    try {
        // Validar datos de entrada
        const { tipo, descripcion, fecha, ubicacion } = req.body;
        
        if (!tipo || !descripcion || !fecha || !ubicacion || !ubicacion.lat || !ubicacion.lng) {
            return res.status(400).json({ error: 'Datos incompletos para registrar el incidente' });
        }
        
        // Registrar el incidente en la base de datos
        const incidente = await db.registrarIncidente(req.body);
        
        // Responder con el incidente registrado
        res.status(201).json({ 
            mensaje: 'Incidente registrado con éxito',
            incidente 
        });
    } catch (error) {
        console.error('Error al registrar incidente:', error);
        res.status(500).json({ error: 'Error al registrar el incidente' });
    }
};

module.exports = {
    getIncidentes,
    registrarIncidente
};