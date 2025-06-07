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

// Agrega este endpoint a tu controlador de rutas
const testOpenRouteService = async (req, res) => {
    try {
        console.log('=== TESTING OPENROUTESERVICE ===');
        
        // Usar las mismas coordenadas que estás probando
        const origen = { lat: -12.1186, lng: -77.0318 };
        const destino = { lat: -12.105, lng: -77.038 };
        const modo = 'driving-car';
        
        console.log('Probando OpenRouteService con:', { origen, destino, modo });
        console.log('API Key:', process.env.OPENROUTE_API_KEY ? 'Configurada' : 'No configurada');
        console.log('Base URL:', 'https://api.openrouteservice.org/v2');
        
        // Intentar obtener ruta real directamente
        let rutaData;
        try {
            console.log('Llamando a openRouteService.obtenerRuta...');
            rutaData = await openRouteService.obtenerRuta(origen, destino, modo);
            console.log('✅ OpenRouteService respondió exitosamente');
            console.log('Estructura de respuesta:', Object.keys(rutaData));
            
            if (rutaData && rutaData.features && rutaData.features.length > 0) {
                const ruta = rutaData.features[0];
                console.log('✅ Ruta encontrada en features[0]');
                console.log('Tipo de geometría:', ruta.geometry?.type);
                console.log('Número de coordenadas:', ruta.geometry?.coordinates?.length);
                console.log('Propiedades de la ruta:', Object.keys(ruta.properties || {}));
                console.log('Primeras 3 coordenadas:', ruta.geometry?.coordinates?.slice(0, 3));
                
                res.json({
                    status: 'SUCCESS',
                    message: 'OpenRouteService funcionando correctamente',
                    formato: 'GeoJSON features',
                    totalCoordinates: ruta.geometry?.coordinates?.length,
                    sample: ruta.geometry?.coordinates?.slice(0, 5),
                    propiedades: ruta.properties
                });
            } else if (rutaData && rutaData.routes && rutaData.routes.length > 0) {
                const ruta = rutaData.routes[0];
                console.log('✅ Ruta encontrada en routes[0]');
                console.log('Tipo de geometría:', ruta.geometry?.type);
                console.log('Número de coordenadas:', ruta.geometry?.coordinates?.length);
                console.log('Summary:', ruta.summary);
                console.log('Primeras 3 coordenadas:', ruta.geometry?.coordinates?.slice(0, 3));
                
                res.json({
                    status: 'SUCCESS',
                    message: 'OpenRouteService funcionando correctamente',
                    formato: 'routes array',
                    totalCoordinates: ruta.geometry?.coordinates?.length,
                    sample: ruta.geometry?.coordinates?.slice(0, 5),
                    summary: ruta.summary
                });
            } else {
                console.log('❌ OpenRouteService devolvió estructura inesperada');
                console.log('Estructura completa:', JSON.stringify(rutaData, null, 2));
                
                res.json({
                    status: 'ERROR',
                    message: 'OpenRouteService devolvió estructura inesperada',
                    response: rutaData
                });
            }
        } catch (error) {
            console.log('❌ ERROR al llamar OpenRouteService:', error.message);
            console.log('Stack:', error.stack);
            
            if (error.response) {
                console.log('Status de respuesta:', error.response.status);
                console.log('Datos de error:', error.response.data);
            }
            
            res.json({
                status: 'ERROR',
                message: 'Error al llamar OpenRouteService',
                error: error.message,
                statusCode: error.response?.status,
                errorData: error.response?.data
            });
        }
        
    } catch (error) {
        console.log('❌ ERROR GENERAL:', error.message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error general en el test',
            error: error.message
        });
    }
};
// También mejora tu función obtenerRutaVisual con mejor logging
const getRutaVisualMejorada = async (req, res) => {
    try {
        console.log('=== INICIANDO getRutaVisual ===');
        
        // Extraer parámetros de la consulta
        const origenLat = parseFloat(req.query.origen_lat);
        const origenLng = parseFloat(req.query.origen_lng);
        const destinoLat = parseFloat(req.query.destino_lat);
        const destinoLng = parseFloat(req.query.destino_lng);
        const modo = req.query.modo || 'driving-car';
        
        console.log('Parámetros recibidos:', { origenLat, origenLng, destinoLat, destinoLng, modo });
        
        // Validar parámetros
        if (isNaN(origenLat) || isNaN(origenLng) || isNaN(destinoLat) || isNaN(destinoLng)) {
            return res.status(400).json({ 
                error: 'Parámetros inválidos. Se requieren origen_lat, origen_lng, destino_lat y destino_lng como valores numéricos.' 
            });
        }
        
        // Crear objetos de origen y destino
        const origen = { lat: origenLat, lng: origenLng };
        const destino = { lat: destinoLat, lng: destinoLng };
        
        console.log('Llamando a rutasService.obtenerRutaVisual...');
        
        // Obtener ruta visual (real o simulada)
        const rutaVisual = await rutasService.obtenerRutaVisual(origen, destino, modo);
        
        console.log('Respuesta de rutasService.obtenerRutaVisual:', {
            tieneRuta: !!rutaVisual.ruta,
            tienePuntosSeguridad: !!rutaVisual.puntosSeguridad,
            tipoRuta: rutaVisual.ruta?.geometry ? 'real' : 'simulada',
            numCoordenadasGeometry: rutaVisual.ruta?.geometry?.coordinates?.length,
            numCoordenadasCaracteristicas: rutaVisual.ruta?.caracteristicas?.[0]?.geometria?.coordenadas?.length
        });
        
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
    getRutaVisual:getRutaVisualMejorada,
    testOpenRouteService
};