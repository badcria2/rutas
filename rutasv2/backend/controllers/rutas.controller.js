const openRouteService = require('../services/openroute.service');
const rutasService = require('../services/rutas.service');
const db = require('../db/db');

// Obtener ruta segura entre dos puntos
const getRutaSegura = async (req, res) => {
    try {
        // Extraer datos de entrada
        const { origen, destino, modo } = req.body;
        
        if (!origen || !destino || !origen.lat || !origen.lng || !destino.lat || !destino.lng) {
            return res.status(400).json({ error: 'Coordenadas de origen y destino son requeridas' });
        }
        
        // Modo de transporte por defecto: auto
        const modoTransporte = modo || 'driving-car';
        
        // Obtener rutas desde OpenRouteService
        let rutaData;
        try {
            rutaData = await openRouteService.obtenerRuta(origen, destino, modoTransporte);
        } catch (error) {
            console.error('Error al obtener ruta de OpenRouteService:', error.message);
            
            // Crear una respuesta de simulación si no podemos obtener la ruta real
            return res.json(rutasService.crearRutaSimulada(origen, destino, modoTransporte));
        }
        
        if (!rutaData || !rutaData.routes || rutaData.routes.length === 0) {
            return res.status(404).json({ error: 'No se encontraron rutas disponibles' });
        }
        
        // Obtener la ruta principal
        const rutaPrincipal = rutaData.routes[0];
        
        // Verificar que la ruta tenga geometría
        if (!rutaPrincipal.geometry || !rutaPrincipal.bbox || !Array.isArray(rutaPrincipal.bbox)) {
            console.error('Ruta sin coordenadas válidas:', rutaPrincipal);
            return res.json(rutasService.crearRutaSimulada(origen, destino, modoTransporte));
        }
        
        // Obtener puntos de seguridad e incidentes cercanos a la ruta
        const coordenadas = rutaPrincipal.bbox;
        const puntosCercanos = await db.getPuntosEnRuta(coordenadas, 300);
        
        // Calcular índice de seguridad de la ruta
        const seguridadScore = await db.calcularIndiceSeguridad(coordenadas);
        
        // Formatear los puntos de seguridad para la respuesta
        const puntosSeguridad = rutasService.formatearPuntosSeguridad(puntosCercanos);
        
        // Añadir el índice de seguridad a la ruta
        rutaPrincipal.seguridadScore = seguridadScore;
        
        // Responder con los datos de la ruta y puntos de seguridad
        res.json({
            ruta: rutaPrincipal,
            puntosSeguridad
        });
    } catch (error) {
        console.error('Error al obtener ruta segura:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud de ruta' });
    }
};

// Obtener rutas alternativas
const getRutasAlternativas = async (req, res) => {
    try {
        // Extraer parámetros de consulta
        const origenLat = parseFloat(req.query.origen_lat);
        const origenLng = parseFloat(req.query.origen_lng);
        const destinoLat = parseFloat(req.query.destino_lat);
        const destinoLng = parseFloat(req.query.destino_lng);
        const modo = req.query.modo || 'driving-car';
        
        if (isNaN(origenLat) || isNaN(origenLng) || isNaN(destinoLat) || isNaN(destinoLng)) {
            return res.status(400).json({ error: 'Coordenadas inválidas' });
        }
        
        // Obtener rutas alternativas
        const rutasData = await openRouteService.obtenerRutasAlternativas(
            { lat: origenLat, lng: origenLng },
            { lat: destinoLat, lng: destinoLng },
            modo
        );
        
        if (!rutasData || !rutasData.routes || rutasData.routes.length === 0) {
            return res.status(404).json({ error: 'No se encontraron rutas alternativas' });
        }
        
        // Procesar cada ruta para obtener su índice de seguridad
        const rutasConSeguridad = await Promise.all(
            rutasData.routes.map(async (ruta) => {
                const coordenadas = ruta.geometry.coordinates;
                const seguridadScore = await db.calcularIndiceSeguridad(coordenadas);
                
                return {
                    ...ruta,
                    seguridadScore
                };
            })
        );
        
        // Ordenar las rutas por índice de seguridad (de más segura a menos segura)
        rutasConSeguridad.sort((a, b) => b.seguridadScore - a.seguridadScore);
        
        // Responder con las rutas alternativas
        res.json({
            rutas: rutasConSeguridad
        });
    } catch (error) {
        console.error('Error al obtener rutas alternativas:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

// Obtener ruta visual
const getRutaVisual = async (req, res) => {
    try {
        // Extraer parámetros de la consulta
        const origenLat = parseFloat(req.query.origen_lat);
        const origenLng = parseFloat(req.query.origen_lng);
        const destinoLat = parseFloat(req.query.destino_lat);
        const destinoLng = parseFloat(req.query.destino_lng);
        const modo = req.query.modo || 'driving-car';
        
        // Validar parámetros
        if (isNaN(origenLat) || isNaN(origenLng) || isNaN(destinoLat) || isNaN(destinoLng)) {
            return res.status(400).json({ 
                error: 'Parámetros inválidos. Se requieren origen_lat, origen_lng, destino_lat y destino_lng como valores numéricos.' 
            });
        }
        
        // Crear objetos de origen y destino
        const origen = { lat: origenLat, lng: origenLng };
        const destino = { lat: destinoLat, lng: destinoLng };
        
        // Obtener ruta visual (real o simulada)
        const rutaVisual = await rutasService.obtenerRutaVisual(origen, destino, modo);
        
        // Responder con los datos de la ruta y puntos de seguridad
        res.json(rutaVisual);
    } catch (error) {
        console.error('Error al generar ruta visual:', error);
        res.status(500).json({ 
            error: 'Error al generar la ruta visual', 
            mensaje: error.message 
        });
    }
};

module.exports = {
    getRutaSegura,
    getRutasAlternativas,
    getRutaVisual
};