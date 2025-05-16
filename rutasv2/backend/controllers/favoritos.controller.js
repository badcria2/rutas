const db = require('../db/db');

// Obtener todas las rutas favoritas guardadas por el usuario
const getRutasFavoritas = async (req, res) => {
    try {
        // Obtener el ID del usuario (en un sistema real esto vendría del token de autenticación)
        // Para esta implementación asumimos que todas las rutas pertenecen al mismo usuario
        const usuarioId = req.query.usuario_id || 1;
        
        // Obtener las rutas favoritas de la base de datos
        const rutasFavoritas = await db.getRutasFavoritas(usuarioId);
        
        res.json(rutasFavoritas);
    } catch (error) {
        console.error('Error al obtener rutas favoritas:', error);
        res.status(500).json({ 
            error: 'Error al obtener rutas favoritas',
            mensaje: error.message 
        });
    }
};

// Obtener una ruta favorita específica por su ID
const getRutaFavoritaPorId = async (req, res) => {
    try {
        const rutaId = req.params.id;
        
        // Obtener la ruta favorita de la base de datos
        const rutaFavorita = await db.getRutaFavoritaPorId(rutaId);
        
        if (!rutaFavorita) {
            return res.status(404).json({
                error: 'Ruta favorita no encontrada'
            });
        }
        
        res.json(rutaFavorita);
    } catch (error) {
        console.error('Error al obtener ruta favorita:', error);
        res.status(500).json({ 
            error: 'Error al obtener ruta favorita',
            mensaje: error.message 
        });
    }
};

// Guardar una nueva ruta favorita
const guardarRutaFavorita = async (req, res) => {
    try {
        // Validar datos de entrada
        const { nombre, origen, destino, modoTransporte } = req.body;
        
        if (!nombre || !origen || !destino || !origen.coordenadas || !destino.coordenadas) {
            return res.status(400).json({ 
                error: 'Datos incompletos para guardar la ruta favorita'
            });
        }
        
        // Obtener el ID del usuario (en un sistema real esto vendría del token de autenticación)
        const usuarioId = req.body.usuario_id || 1;
        
        // Guardar la ruta favorita en la base de datos
        const nuevaRuta = await db.guardarRutaFavorita({
            usuario_id: usuarioId,
            nombre,
            origen_nombre: origen.nombre,
            origen_lat: origen.coordenadas.lat,
            origen_lng: origen.coordenadas.lng,
            destino_nombre: destino.nombre,
            destino_lat: destino.coordenadas.lat,
            destino_lng: destino.coordenadas.lng,
            modo_transporte: modoTransporte || 'driving-car',
            fecha_creacion: new Date().toISOString()
        });
        
        res.status(201).json({
            mensaje: 'Ruta favorita guardada con éxito',
            ruta: nuevaRuta
        });
    } catch (error) {
        console.error('Error al guardar ruta favorita:', error);
        res.status(500).json({ 
            error: 'Error al guardar ruta favorita',
            mensaje: error.message 
        });
    }
};

// Actualizar una ruta favorita existente
const actualizarRutaFavorita = async (req, res) => {
    try {
        const rutaId = req.params.id;
        
        // Validar datos de entrada
        const { nombre, origen, destino, modoTransporte } = req.body;
        
        if (!nombre || !origen || !destino || !origen.coordenadas || !destino.coordenadas) {
            return res.status(400).json({ 
                error: 'Datos incompletos para actualizar la ruta favorita'
            });
        }
        
        // Verificar que la ruta exista
        const rutaExistente = await db.getRutaFavoritaPorId(rutaId);
        
        if (!rutaExistente) {
            return res.status(404).json({
                error: 'Ruta favorita no encontrada'
            });
        }
        
        // Actualizar la ruta en la base de datos
        const rutaActualizada = await db.actualizarRutaFavorita(rutaId, {
            nombre,
            origen_nombre: origen.nombre,
            origen_lat: origen.coordenadas.lat,
            origen_lng: origen.coordenadas.lng,
            destino_nombre: destino.nombre,
            destino_lat: destino.coordenadas.lat,
            destino_lng: destino.coordenadas.lng,
            modo_transporte: modoTransporte || 'driving-car'
        });
        
        res.json({
            mensaje: 'Ruta favorita actualizada con éxito',
            ruta: rutaActualizada
        });
    } catch (error) {
        console.error('Error al actualizar ruta favorita:', error);
        res.status(500).json({ 
            error: 'Error al actualizar ruta favorita',
            mensaje: error.message 
        });
    }
};

// Eliminar una ruta favorita
const eliminarRutaFavorita = async (req, res) => {
    try {
        const rutaId = req.params.id;
        
        // Verificar que la ruta exista
        const rutaExistente = await db.getRutaFavoritaPorId(rutaId);
        
        if (!rutaExistente) {
            return res.status(404).json({
                error: 'Ruta favorita no encontrada'
            });
        }
        
        // Eliminar la ruta de la base de datos
        await db.eliminarRutaFavorita(rutaId);
        
        res.json({
            mensaje: 'Ruta favorita eliminada con éxito'
        });
    } catch (error) {
        console.error('Error al eliminar ruta favorita:', error);
        res.status(500).json({ 
            error: 'Error al eliminar ruta favorita',
            mensaje: error.message 
        });
    }
};

module.exports = {
    getRutasFavoritas,
    getRutaFavoritaPorId,
    guardarRutaFavorita,
    actualizarRutaFavorita,
    eliminarRutaFavorita
};