/**
 * Middleware para validación de datos de entrada
 */

/**
 * Valida coordenadas geográficas
 */
function validarCoordenadas(req, res, next) {
    // Determinar si las coordenadas vienen en params o query
    const params = req.method === 'GET' ? req.query : req.body;
    
    // En caso de rutas
    if (params.origen && params.destino) {
        // Validar coordenadas de origen
        if (!params.origen.lat || !params.origen.lng || 
            isNaN(params.origen.lat) || isNaN(params.origen.lng)) {
            return res.status(400).json({
                error: 'Coordenadas de origen inválidas'
            });
        }
        
        // Validar coordenadas de destino
        if (!params.destino.lat || !params.destino.lng || 
            isNaN(params.destino.lat) || isNaN(params.destino.lng)) {
            return res.status(400).json({
                error: 'Coordenadas de destino inválidas'
            });
        }
    } 
    // En caso de puntos de seguridad o incidentes
    else if ((params.lat !== undefined && params.lng !== undefined) ||
             (params.origen_lat !== undefined && params.origen_lng !== undefined)) {
        
        const lat = params.lat !== undefined ? params.lat : params.origen_lat;
        const lng = params.lng !== undefined ? params.lng : params.origen_lng;
        
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                error: 'Coordenadas inválidas'
            });
        }
    }
    
    // Si todo está bien, continuar
    next();
}

/**
 * Valida datos de incidente
 */
function validarDatosIncidente(req, res, next) {
    const { tipo, descripcion, fecha, ubicacion } = req.body;
    
    // Validar campos requeridos
    if (!tipo || !descripcion || !fecha || !ubicacion || !ubicacion.lat || !ubicacion.lng) {
        return res.status(400).json({
            error: 'Datos incompletos para registrar el incidente'
        });
    }
    
    // Validar tipo de incidente
    const tiposValidos = ['robo', 'acoso', 'accidente', 'otro'];
    if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
            error: 'Tipo de incidente inválido'
        });
    }
    
    // Validar fecha
    if (isNaN(Date.parse(fecha))) {
        return res.status(400).json({
            error: 'Formato de fecha inválido'
        });
    }
    
    // Si todo está bien, continuar
    next();
}

/**
 * Valida datos de ruta favorita
 */
function validarDatosRutaFavorita(req, res, next) {
    const { nombre, origen, destino } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !origen || !destino) {
        return res.status(400).json({
            error: 'Datos incompletos para la ruta favorita'
        });
    }
    
    // Validar origen
    if (!origen.nombre || !origen.coordenadas || 
        !origen.coordenadas.lat || !origen.coordenadas.lng) {
        return res.status(400).json({
            error: 'Datos de origen incompletos'
        });
    }
    
    // Validar destino
    if (!destino.nombre || !destino.coordenadas || 
        !destino.coordenadas.lat || !destino.coordenadas.lng) {
        return res.status(400).json({
            error: 'Datos de destino incompletos'
        });
    }
    
    // Si todo está bien, continuar
    next();
}

module.exports = {
    validarCoordenadas,
    validarDatosIncidente,
    validarDatosRutaFavorita
};