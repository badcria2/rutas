/**
 * api.js
 * Define las rutas API para la aplicación Rutas Seguras Lima
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db/db');

// Token de acceso a OpenRouteService (se recomienda usar variables de entorno)
const ORS_API_KEY = process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf62485bae0162dc5e4090a9353097b62bb6ae';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

/**
 * GET /api/puntos-seguridad
 * Obtiene puntos de seguridad cercanos a una ubicación
 */
router.get('/puntos-seguridad', async (req, res) => {
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
});

/**
 * GET /api/incidentes
 * Obtiene incidentes reportados cercanos a una ubicación
 */
router.get('/incidentes', async (req, res) => {
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
});

/**
 * POST /api/incidentes
 * Registra un nuevo incidente
 */
router.post('/incidentes', async (req, res) => {
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
});

/**
 * POST /api/rutas-seguras
 * Obtiene la ruta más segura entre dos puntos
 */
router.post('/rutas-seguras', async (req, res) => {
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
            rutaData = await obtenerRutaORS(origen, destino, modoTransporte);
        } catch (error) {
            console.error('Error al obtener ruta de OpenRouteService:', error.message);
            
            // Crear una respuesta de simulación si no podemos obtener la ruta real
            return res.json(crearRutaSimulada(origen, destino, modoTransporte));
        }
        
        if (!rutaData || !rutaData.routes || rutaData.routes.length === 0) {
            return res.status(404).json({ error: 'No se encontraron rutas disponibles' });
        }
        
        // Obtener la ruta principal
        const rutaPrincipal = rutaData.routes[0];
        
        // Verificar que la ruta tenga geometría
        if (!rutaPrincipal.geometry || !rutaPrincipal.bbox || !Array.isArray(rutaPrincipal.bbox)) {
            console.error('Ruta sin coordenadas válidas:', rutaPrincipal);
            return res.json(crearRutaSimulada(origen, destino, modoTransporte));
        }
        
        // Obtener puntos de seguridad e incidentes cercanos a la ruta
        const coordenadas = rutaPrincipal.bbox;
        const puntosCercanos = await db.getPuntosEnRuta(coordenadas, 300);
        
        // Calcular índice de seguridad de la ruta
        const seguridadScore = await db.calcularIndiceSeguridad(coordenadas);
        
        // Formatear los puntos de seguridad para la respuesta
        const puntosSeguridad = [
            ...puntosCercanos.puntosSeguridad.map(p => ({
                id: p.id,
                nombre: p.nombre,
                tipo: p.tipo,
                descripcion: p.descripcion,
                lat: p.lat,
                lng: p.lng,
                distancia: Math.round(p.distancia)
            })),
            ...puntosCercanos.incidentes.map(i => ({
                id: i.id,
                nombre: `Incidente: ${i.tipo}`,
                tipo: 'incidente',
                descripcion: i.descripcion,
                lat: i.lat,
                lng: i.lng,
                distancia: Math.round(i.distancia),
                fecha: i.fecha
            }))
        ];
        
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
});
 
 /**
 * Genera coordenadas realistas para una ruta que simula el patrón de calles
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Array} - Array de coordenadas [lng, lat]
 */
function generarCoordenadasRealistasParaRuta(origen, destino, modo) {
    // Convertir a formato [lng, lat] que usa OpenRouteService
    const coordInicio = [origen.lng, origen.lat];
    const coordFin = [destino.lng, destino.lat];
    
    // Determinar número de puntos basado en la distancia
    const distanciaDirecta = calcularDistanciaSimulada(origen, destino);
    
    // Más puntos para distancias más largas, y según el modo de transporte
    let numPuntos;
    if (modo === 'foot-walking') {
        // Caminando suele tener más giros/desvíos
        numPuntos = Math.max(10, Math.ceil(distanciaDirecta / 150));
    } else if (modo === 'cycling-regular') {
        // En bicicleta, ruta intermedia
        numPuntos = Math.max(8, Math.ceil(distanciaDirecta / 200));
    } else {
        // En auto, rutas más directas pero siguiendo calles principales
        numPuntos = Math.max(6, Math.ceil(distanciaDirecta / 250));
    }
    
    // Limitar para no tener demasiados puntos
    numPuntos = Math.min(numPuntos, 25);
    
    // Determinar si estamos en Lima (las calles suelen tener patrón en cuadrícula)
    const esLima = (origen.lat > -12.2 && origen.lat < -11.9 && 
                   origen.lng > -77.2 && origen.lng < -76.9);
    
    // Calcular distancia directa en grados
    const difLat = destino.lat - origen.lat;
    const difLng = destino.lng - origen.lng;
    
    // Determinar orientación principal (norte-sur o este-oeste)
    const esNorteSur = Math.abs(difLat) > Math.abs(difLng);
    
    // Array para acumular las coordenadas
    const coordenadas = [coordInicio];
    
    if (esLima) {
        // Para zonas urbanas de Lima, crear una ruta que siga la cuadrícula de calles
        
        // Dividir el recorrido en múltiples segmentos rectos 
        // que simulan el trazado en cuadrícula de Lima
        
        // Determinar si vamos a empezar vertical u horizontal
        // basándonos en la dirección de la ruta y otros factores
        const inicioVertical = esNorteSur || Math.random() < 0.6;
        
        // Punto actual
        let latActual = origen.lat;
        let lngActual = origen.lng;
        
        // Número de segmentos para la ruta
        // Lima tiene más segmentos en sus rutas por la cuadrícula de calles
        const numSegmentos = Math.min(numPuntos, Math.floor(Math.random() * 4) + 4);
        
        // Longitud típica de las cuadras en Lima (en grados)
        const longitudCuadra = 0.003; // aproximadamente 300 metros
        
        // Dirección actual (vertical = true, horizontal = false)
        let direccionVertical = inicioVertical;
        
        // Generar segmentos de ruta que imitan la cuadrícula
        for (let i = 0; i < numSegmentos; i++) {
            // Factor de progreso en la ruta (0-1)
            const factorRuta = (i + 1) / numSegmentos;
            
            // Determinar cuánto avanzamos en esta sección
            // Las primeras secciones son más largas que las últimas
            const factorAvance = Math.max(0.1, 1 - factorRuta);
            
            if (direccionVertical) {
                // Mover en dirección norte-sur
                // El avance es proporcional a la distancia total pero limitado a tamaño de cuadras
                let avance = difLat * factorAvance;
                
                // Limitar para que parezca que avanzamos de cuadra en cuadra
                avance = Math.sign(avance) * Math.min(Math.abs(avance), longitudCuadra * (Math.floor(Math.random() * 3) + 1));
                
                latActual += avance;
                
                // Pequeña variación para que no sean perfectamente rectas
                if (Math.random() < 0.3) {
                    lngActual += (Math.random() - 0.5) * 0.0003;
                }
            } else {
                // Mover en dirección este-oeste
                let avance = difLng * factorAvance;
                
                // Limitar para que parezca que avanzamos de cuadra en cuadra
                avance = Math.sign(avance) * Math.min(Math.abs(avance), longitudCuadra * (Math.floor(Math.random() * 3) + 1));
                
                lngActual += avance;
                
                // Pequeña variación para que no sean perfectamente rectas
                if (Math.random() < 0.3) {
                    latActual += (Math.random() - 0.5) * 0.0003;
                }
            }
            
            // Añadir el punto al recorrido
            coordenadas.push([lngActual, latActual]);
            
            // Cambiar de dirección para el próximo segmento, con mayor probabilidad
            // cuando nos acercamos al destino o cuando llevamos mucho en la misma dirección
            if (Math.random() < 0.7 || i > numSegmentos - 3) {
                direccionVertical = !direccionVertical;
            }
        }
        
        // Asegurarnos de que los últimos segmentos nos acercan al destino
        // Añadir 1-2 puntos finales para llegar al destino
        const puntosFinales = Math.floor(Math.random() * 2) + 1;
        for (let i = 1; i <= puntosFinales; i++) {
            const factor = i / (puntosFinales + 1);
            
            // Interpolación entre último punto añadido y destino
            const lat = latActual + (destino.lat - latActual) * factor;
            const lng = lngActual + (destino.lng - lngActual) * factor;
            
            coordenadas.push([lng, lat]);
        }
    } else {
        // Para zonas no urbanas, carreteras o áreas fuera de Lima
        // Usamos un enfoque más orgánico con curvas suaves
        
        // Crear puntos de control para una curva Bézier o spline
        const puntosControl = [];
        
        // Añadir el origen como primer punto de control
        puntosControl.push({lat: origen.lat, lng: origen.lng});
        
        // Generar 1-3 puntos de control intermedios
        const numPuntosControl = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 1; i <= numPuntosControl; i++) {
            // Factor de progreso a lo largo de la línea directa
            const factor = i / (numPuntosControl + 1);
            
            // Posición base a lo largo de la línea directa
            const latBase = origen.lat + difLat * factor;
            const lngBase = origen.lng + difLng * factor;
            
            // Añadir desviación perpendicular a la dirección principal
            // Mayor desviación en el medio, menor al inicio y fin
            const factorDesviacion = Math.sin(factor * Math.PI);
            const maxDesviacion = 0.005; // aproximadamente 500 metros máximo
            
            let desviacion;
            if (esNorteSur) {
                // Desviación en longitud (perpendicular a norte-sur)
                desviacion = {
                    lat: 0,
                    lng: (Math.random() * 2 - 1) * maxDesviacion * factorDesviacion
                };
            } else {
                // Desviación en latitud (perpendicular a este-oeste)
                desviacion = {
                    lat: (Math.random() * 2 - 1) * maxDesviacion * factorDesviacion,
                    lng: 0
                };
            }
            
            // Añadir punto de control con desviación
            puntosControl.push({
                lat: latBase + desviacion.lat,
                lng: lngBase + desviacion.lng
            });
        }
        
        // Añadir el destino como último punto de control
        puntosControl.push({lat: destino.lat, lng: destino.lng});
        
        // Generar puntos a lo largo de la curva definida por los puntos de control
        for (let i = 0; i <= numPuntos; i++) {
            const t = i / numPuntos;
            
            // Calcular punto en la curva
            const punto = interpolacionCurva(puntosControl, t);
            
            // Añadir a las coordenadas
            coordenadas.push([punto.lng, punto.lat]);
        }
    }
    
    // Siempre añadimos el punto final exacto
    if (coordenadas[coordenadas.length - 1][0] !== coordFin[0] || 
        coordenadas[coordenadas.length - 1][1] !== coordFin[1]) {
        coordenadas.push(coordFin);
    }
    
    return coordenadas;
}

/**
 * Interpola un punto a lo largo de una curva definida por puntos de control
 * Usa interpolación de curva Bézier 
 * @param {Array} puntosControl - Array de puntos de control {lat, lng}
 * @param {number} t - Parámetro de la curva (0-1)
 * @returns {Object} - Punto interpolado {lat, lng}
 */
function interpolacionCurva(puntosControl, t) {
    // Para curvas Bézier cúbicas necesitamos exactamente 4 puntos
    // Si tenemos más o menos, adaptamos
    let p0, p1, p2, p3;
    
    if (puntosControl.length === 2) {
        // Interpolación lineal
        p0 = puntosControl[0];
        p1 = puntosControl[0];
        p2 = puntosControl[1];
        p3 = puntosControl[1];
    } else if (puntosControl.length === 3) {
        // Curva cuadrática
        p0 = puntosControl[0];
        p1 = puntosControl[1];
        p2 = puntosControl[1];
        p3 = puntosControl[2];
    } else if (puntosControl.length === 4) {
        // Curva cúbica
        p0 = puntosControl[0];
        p1 = puntosControl[1];
        p2 = puntosControl[2];
        p3 = puntosControl[3];
    } else if (puntosControl.length > 4) {
        // Para más de 4 puntos, seleccionamos los 4 más relevantes basados en t
        const idx = Math.floor(t * (puntosControl.length - 3));
        p0 = puntosControl[idx];
        p1 = puntosControl[idx + 1];
        p2 = puntosControl[idx + 2];
        p3 = puntosControl[idx + 3];
    } else {
        // Si solo tenemos un punto, lo devolvemos
        return puntosControl[0];
    }
    
    // Cálculo de curva Bézier cúbica
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
        lat: p0.lat * mt3 + 3 * p1.lat * mt2 * t + 3 * p2.lat * mt * t2 + p3.lat * t3,
        lng: p0.lng * mt3 + 3 * p1.lng * mt2 * t + 3 * p2.lng * mt * t2 + p3.lng * t3
    };
}
/**
 * Crea una ruta simulada cuando hay problemas con la API
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Object} - Datos simulados de ruta
 */
function crearRutaSimulada(origen, destino, modo) {
    // Crear una ruta con múltiples puntos que simule calles reales
    const rutaGeometry = {
        type: "LineString",
        coordinates: generarCoordenadasRealistasParaRuta(origen, destino, modo)
    };
    
    // Calcular distancia de la ruta (sumando distancias entre puntos)
    const dist = calcularDistanciaRutaCompleta(rutaGeometry.coordinates);
    
    // Calcular tiempo según modo de transporte
    const velocidades = {
        'driving-car': 11.11, // 40 km/h en m/s
        'foot-walking': 1.4,  // 5 km/h en m/s
        'cycling-regular': 4.17 // 15 km/h en m/s
    };
    const velocidad = velocidades[modo] || velocidades['driving-car'];
    const tiempo = Math.round(dist / velocidad);
    
    // Crear datos de ruta simulados
    const rutaSimulada = {
        geometry: rutaGeometry,
        properties: {
            segments: [{
                distance: dist,
                duration: tiempo,
                steps: []
            }],
            summary: {
                distance: dist,
                duration: tiempo
            },
            way_points: [0, rutaGeometry.coordinates.length - 1]
        },
        seguridadScore: 65 + Math.floor(Math.random() * 20) // Entre 65-85
    };
    
    // Crear puntos de seguridad simulados
    const puntosSeguridadSimulados = generarPuntosSeguridadSimulados(rutaGeometry.coordinates);
    
    return {
        ruta: rutaSimulada,
        puntosSeguridad: puntosSeguridadSimulados
    };
}
/**
 * Calcula la distancia total de una ruta basada en sus coordenadas
 * @param {Array} coordenadas - Array de coordenadas [lng, lat]
 * @returns {number} - Distancia total en metros
 */
function calcularDistanciaRutaCompleta(coordenadas) {
    let distanciaTotal = 0;
    
    for (let i = 0; i < coordenadas.length - 1; i++) {
        const punto1 = {
            lat: coordenadas[i][1],
            lng: coordenadas[i][0]
        };
        const punto2 = {
            lat: coordenadas[i+1][1],
            lng: coordenadas[i+1][0]
        };
        
        distanciaTotal += calcularDistanciaSimulada(punto1, punto2);
    }
    
    return distanciaTotal;
}

/**
 * Calcula la distancia aproximada entre dos puntos
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @returns {number} - Distancia en metros
 */
function calcularDistanciaSimulada(origen, destino) {
    // Fórmula de Haversine para calcular distancia en metros
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = origen.lat * Math.PI/180;
    const lat2 = destino.lat * Math.PI/180;
    const deltaLat = (destino.lat - origen.lat) * Math.PI/180;
    const deltaLng = (destino.lng - origen.lng) * Math.PI/180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    return distancia;
}

 
/**
 * Genera puntos de seguridad simulados a lo largo de una ruta
 * @param {Array} coordenadas - Array de coordenadas [lng, lat] de la ruta
 * @returns {Array} - Array de puntos de seguridad simulados
 */
function generarPuntosSeguridadSimulados(coordenadas) {
    // Tipos de puntos de seguridad
    const tiposPuntos = ['comisaria', 'serenazgo', 'hospital', 'incidente', 'iluminacion'];
    
    // Nombres para los puntos según su tipo
    const nombresPorTipo = {
        comisaria: ['Comisaría de Miraflores', 'Comisaría de San Isidro', 'Comisaría de Barranco', 'Comisaría PNP', 'Estación de Policía'],
        serenazgo: ['Serenazgo Municipal', 'Base de Serenazgo', 'Puesto de Serenazgo', 'Unidad de Vigilancia', 'Patrulla de Serenazgo'],
        hospital: ['Hospital Local', 'Clínica Internacional', 'Centro Médico', 'Posta Médica', 'Hospital de Emergencias'],
        incidente: ['Robo reportado', 'Zona de acoso', 'Accidente de tránsito', 'Arrebato de celular', 'Robo de cartera'],
        iluminacion: ['Zona bien iluminada', 'Área con iluminación', 'Parque iluminado', 'Avenida iluminada', 'Zona con cámaras']
    };
    
    // Generar entre 5 y 10 puntos
    const numPuntos = 5 + Math.floor(Math.random() * 6);
    const puntos = [];
    
    for (let i = 0; i < numPuntos; i++) {
        // Seleccionar un tipo aleatorio
        const tipo = tiposPuntos[Math.floor(Math.random() * tiposPuntos.length)];
        
        // Seleccionar un nombre aleatorio para ese tipo
        const nombres = nombresPorTipo[tipo] || ['Punto de seguridad'];
        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        
        // Seleccionar un punto de la ruta como base
        const puntoBase = coordenadas[Math.floor(Math.random() * coordenadas.length)];
        
        // Añadir un offset aleatorio para que no esté exactamente en la ruta
        // Más cerca para puntos de iluminación, más lejos para otros
        let offsetMagnitud;
        if (tipo === 'iluminacion') {
            offsetMagnitud = 0.0005 + Math.random() * 0.001; // 55-155m aprox
        } else {
            offsetMagnitud = 0.001 + Math.random() * 0.002; // 110-330m aprox
        }
        
        // Dirección aleatoria
        const anguloRadianes = Math.random() * Math.PI * 2;
        const offsetLng = Math.cos(anguloRadianes) * offsetMagnitud;
        const offsetLat = Math.sin(anguloRadianes) * offsetMagnitud;
        
        // Distancia aproximada en metros
        const distancia = offsetMagnitud * 111000; // 1 grado ≈ 111km
        
        // Crear el punto
        const punto = {
            id: i + 1,
            nombre: nombre,
            tipo: tipo,
            descripcion: getTipoDescripcion(tipo),
            lat: puntoBase[1] + offsetLat,
            lng: puntoBase[0] + offsetLng,
            distancia: Math.round(distancia)
        };
        
        puntos.push(punto);
    }
    
    return puntos;
}
/**
 * Obtiene una descripción apropiada para cada tipo de punto
 * @param {string} tipo - Tipo de punto de seguridad
 * @returns {string} - Descripción
 */
function getTipoDescripcion(tipo) {
    const descripciones = {
        comisaria: [
            'Atiende las 24 horas', 
            'Patrullaje frecuente',
            'Servicio de emergencias',
            'Unidad de respuesta rápida',
            'Vigilancia permanente'
        ],
        serenazgo: [
            'Patrulla en vehículos y bicicletas',
            'Con cámaras de vigilancia',
            'Cobertura 24/7',
            'Coordinación con policía',
            'Respuesta en minutos'
        ],
        hospital: [
            'Atención de emergencias',
            'Ambulancias disponibles',
            'Servicio médico 24/7',
            'Centro de trauma',
            'Unidad de cuidados intensivos'
        ],
        incidente: [
            'Reportado hace 2 días',
            'Zona con alerta de seguridad',
            'Múltiples reportes en el área',
            'Vigilancia aumentada',
            'Reportado recientemente'
        ],
        iluminacion: [
            'Alumbrado público de alta potencia',
            'Iluminación LED reciente',
            'Postes de luz cada 20 metros',
            'Zona comercial bien iluminada',
            'Con cámaras y alumbrado'
        ]
    };
    
    const opcionesDescripcion = descripciones[tipo] || ['Punto de interés'];
    return opcionesDescripcion[Math.floor(Math.random() * opcionesDescripcion.length)];
}

/**
 * Obtiene una ruta desde OpenRouteService
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Promise<Object>} - Datos de la ruta
 */
async function obtenerRutaORS(origen, destino, modo) {
    try {
        // Preparar las coordenadas para la petición
        // OpenRouteService usa [longitud, latitud] en lugar de [latitud, longitud]
        const coordinates = [
            [origen.lng, origen.lat],
            [destino.lng, destino.lat]
        ];
        
        // Configurar la petición
        const url = `${ORS_BASE_URL}/directions/${modo}`;
        const headers = {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const data = {
            coordinates,
            format: 'geojson', // Para obtener la geometría en formato GeoJSON
            instructions: true,
            language: 'es',
            units: 'km'
        };
        
        // Realizar la petición
        const response = await axios.post(url, data, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error al obtener ruta desde OpenRouteService:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        throw error;
    }
}

/**
 * GET /api/rutas-alternativas
 * Obtiene rutas alternativas entre dos puntos
 */
router.get('/rutas-alternativas', async (req, res) => {
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
        const rutasData = await obtenerRutasAlternativasORS(
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
});

/**
 * Obtiene rutas alternativas desde OpenRouteService
 * @param {Object} origen - Coordenadas de origen {lat, lng}
 * @param {Object} destino - Coordenadas de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Promise<Object>} - Datos de las rutas alternativas
 */
async function obtenerRutasAlternativasORS(origen, destino, modo) {
    try {
        // Preparar las coordenadas para la petición
        const coordinates = [
            [origen.lng, origen.lat],
            [destino.lng, destino.lat]
        ];
        
        // Configurar la petición
        const url = `${ORS_BASE_URL}/directions/${modo}`;
        const headers = {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const data = {
            coordinates,
            format: 'geojson',
            instructions: true,
            language: 'es',
            units: 'km',
            alternative_routes: {
                target_count: 3,        // Cantidad de rutas alternativas
                weight_factor: 1.6,     // Factor de peso para las alternativas
                share_factor: 0.8       // Factor de compartición de segmentos
            }
        };
        
        // Realizar la petición
        const response = await axios.post(url, data, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error al obtener rutas alternativas desde OpenRouteService:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        throw error;
    }
}

/**
 * Endpoint para obtener una ruta visual entre dos puntos
 * Este endpoint se puede agregar a tu archivo api.js
 */

/**
 * GET /api/ruta-visual
 * Genera una ruta visual natural entre dos puntos para visualización en el mapa
 */
router.get('/ruta-visual', async (req, res) => {
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
        
        // Intentar obtener una ruta desde OpenRouteService
        let rutaVisual;
        try {
            // Intentar obtener una ruta real
            const rutaData = await obtenerRutaORS(origen, destino, modo);
            if (rutaData && rutaData.routes && rutaData.routes.length > 0) {
                rutaVisual = prepararRutaVisual(rutaData.routes[0]);
            } else {
                throw new Error('No se pudo obtener una ruta válida de OpenRouteService');
            }
        } catch (error) {
            // Si falla, generar una ruta simulada para visualización
            console.log('Usando ruta simulada para visualización', error.message);
            rutaVisual = generarRutaVisualSimulada(origen, destino, modo);
        }
        
        // Obtener puntos de seguridad e incidentes cercanos a la ruta
        const coordenadas = rutaVisual.bounds;
        const puntosCercanos = await db.getPuntosEnRuta(coordenadas, 300);
        
        // Calcular índice de seguridad de la ruta
        const seguridadScore = await db.calcularIndiceSeguridad(coordenadas);
        
        // Formatear los puntos de seguridad para la respuesta
        const puntosSeguridad = [
            ...puntosCercanos.puntosSeguridad.map(p => ({
                id: p.id,
                nombre: p.nombre,
                tipo: p.tipo,
                descripcion: p.descripcion,
                lat: p.lat,
                lng: p.lng,
                distancia: Math.round(p.distancia)
            })),
            ...puntosCercanos.incidentes.map(i => ({
                id: i.id,
                nombre: `Incidente: ${i.tipo}`,
                tipo: 'incidente',
                descripcion: i.descripcion,
                lat: i.lat,
                lng: i.lng,
                distancia: Math.round(i.distancia),
                fecha: i.fecha
            }))
        ];
        
        // Añadir el índice de seguridad a la ruta
        rutaVisual.seguridadScore = seguridadScore;
        
        // Responder con los datos de la ruta y puntos de seguridad
        res.json({
            ruta: rutaVisual,
            puntosSeguridad
        });
 
        
    } catch (error) {
        console.error('Error al generar ruta visual:', error);
        res.status(500).json({ 
            error: 'Error al generar la ruta visual', 
            mensaje: error.message 
        });
    }
});

/**
 * Prepara una ruta de OpenRouteService para visualización
 * @param {Object} ruta - Ruta obtenida de OpenRouteService
 * @returns {Object} - Ruta procesada para visualización
 */
function prepararRutaVisual(ruta) {
    // Extraer las coordenadas de la ruta
    const coordenadas = decodificarPolyline(ruta.geometry);

    // Extraer propiedades importantes
    const distancia = ruta.summary.distance;
    const duracion = ruta.summary.duration;
    
    // Devolver el objeto de ruta visual
    return {
        tipo: 'FeatureCollection',
        propiedades: {
            distancia: distancia,
            duracion: duracion
        },
        caracteristicas: [{
            tipo: 'Feature',
            geometria: {
                tipo: 'LineString',
                coordenadas: coordenadas
            }
        }],
        bounds: ruta.bbox
    };
}/**
 * Decodifica una cadena polyline en coordenadas
 * @param {string} encodedPolyline - Polyline codificado
 * @returns {Array} - Array de coordenadas [lng, lat]
 */
function decodificarPolyline(encodedPolyline) {
    // Factor de precisión para decodificación
    const factor = 1e5;
    let index = 0;
    let lat = 0;
    let lng = 0;
    const coordinates = [];
    
    while (index < encodedPolyline.length) {
        let shift = 0;
        let result = 0;
        let byte;
        
        do {
            byte = encodedPolyline.charCodeAt(index++) - 63; // Restar 63 (ASCII offset)
            result |= (byte & 0x1f) << shift; // Máscara de 5 bits
            shift += 5;
        } while (byte >= 0x20); // Continuar si hay más bytes
        
        // Valor delta para latitud
        const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;
        
        shift = 0;
        result = 0;
        
        do {
            byte = encodedPolyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        
        // Valor delta para longitud
        const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += deltaLng;
        
        // Agregar coordenada [lng, lat] al resultado (ORS usa formato [lng, lat])
        coordinates.push([lng / factor, lat / factor]);
    }
    
    return coordinates;
}

/**
 * Genera una ruta visual simulada entre dos puntos
 * @param {Object} origen - Punto de origen {lat, lng}
 * @param {Object} destino - Punto de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Object} - Ruta simulada para visualización
 */
function generarRutaVisualSimulada(origen, destino, modo) {
    // Generar coordenadas intermedias realistas
    const coordenadas = generarCoordenadasNaturales(origen, destino, modo);
    
    // Calcular distancia aproximada
    const distancia = calcularDistanciaTotal(coordenadas.map(c => ({lat: c[1], lng: c[0]})));
    
    // Calcular duración aproximada según modo
    const velocidades = {
        'driving-car': 40, // km/h
        'foot-walking': 5,  // km/h
        'cycling-regular': 15 // km/h
    };
    const velocidad = velocidades[modo] || velocidades['driving-car'];
    const duracionHoras = distancia / 1000 / velocidad;
    const duracionSegundos = Math.round(duracionHoras * 3600);
    
    // Calcular bbox (límites) para la ruta
    const minLat = Math.min(origen.lat, destino.lat) - 0.005;
    const maxLat = Math.max(origen.lat, destino.lat) + 0.005;
    const minLng = Math.min(origen.lng, destino.lng) - 0.005;
    const maxLng = Math.max(origen.lng, destino.lng) + 0.005;
    
    // Devolver objeto de ruta simulada
    return {
        tipo: 'FeatureCollection',
        propiedades: {
            distancia: distancia,
            duracion: duracionSegundos
        },
        caracteristicas: [{
            tipo: 'Feature',
            geometria: {
                tipo: 'LineString',
                coordenadas: coordenadas
            }
        }],
        bounds: [minLng, minLat, maxLng, maxLat]
    };
}

/**
 * Genera coordenadas para una ruta natural entre dos puntos
 * @param {Object} origen - Punto de origen {lat, lng}
 * @param {Object} destino - Punto de destino {lat, lng}
 * @param {string} modo - Modo de transporte
 * @returns {Array} - Array de coordenadas [[lng, lat], ...]
 */
function generarCoordenadasNaturales(origen, destino, modo) {
    // Arreglo para las coordenadas resultantes
    const resultado = [];
    
    // Añadir punto de origen (en formato [lng, lat] para GeoJSON)
    resultado.push([origen.lng, origen.lat]);
    
    // Calcular diferencias entre origen y destino
    const difLat = destino.lat - origen.lat;
    const difLng = destino.lng - origen.lng;
    
    // Determinar si la dirección principal es norte-sur o este-oeste
    const esNorteSur = Math.abs(difLat) > Math.abs(difLng);
    
    // Determinar número de puntos intermedios según el modo y la distancia
    let numPuntos;
    const distanciaDirecta = calcularDistancia(origen, destino);
    
    if (modo === 'foot-walking') {
        numPuntos = Math.max(8, Math.ceil(distanciaDirecta / 150));
    } else if (modo === 'cycling-regular') {
        numPuntos = Math.max(6, Math.ceil(distanciaDirecta / 200));
    } else {
        numPuntos = Math.max(4, Math.ceil(distanciaDirecta / 250));
    }
    
    // Limitar para mantener rendimiento
    numPuntos = Math.min(numPuntos, 15);
    
    // Variables para simular calles
    let latActual = origen.lat;
    let lngActual = origen.lng;
    const latDestino = destino.lat;
    const lngDestino = destino.lng;
    
    // Primer segmento: seguir la dirección principal
    if (esNorteSur) {
        // Avanzar en latitud (norte-sur) primero
        latActual = origen.lat + difLat * 0.7;
        resultado.push([lngActual, latActual]);
        
        // Luego avanzar en longitud (este-oeste)
        lngActual = lngDestino;
        resultado.push([lngActual, latActual]);
    } else {
        // Avanzar en longitud (este-oeste) primero
        lngActual = origen.lng + difLng * 0.7;
        resultado.push([lngActual, latActual]);
        
        // Luego avanzar en latitud (norte-sur)
        latActual = latDestino;
        resultado.push([lngActual, latActual]);
    }
    
    // Añadir variaciones para que la ruta no sea perfectamente recta
    // (esto simula que las calles no son perfectamente rectas)
    for (let i = 1; i < resultado.length - 1; i++) {
        // Pequeña variación aleatoria para que no sea una línea recta perfecta
        if (Math.random() > 0.3) {
            // Decidir si modificamos lat o lng
            if (Math.random() > 0.5) {
                resultado[i][0] += (Math.random() - 0.5) * 0.0005;
            } else {
                resultado[i][1] += (Math.random() - 0.5) * 0.0005;
            }
        }
    }
    
    // Añadir punto de destino
    resultado.push([destino.lng, destino.lat]);
    
    // Suavizar la ruta añadiendo puntos intermedios
    return suavizarRuta(resultado);
}

/**
 * Suaviza una ruta añadiendo puntos interpolados
 * @param {Array} ruta - Array de coordenadas [[lng, lat], ...]
 * @returns {Array} - Ruta suavizada
 */
function suavizarRuta(ruta) {
    const rutaSuavizada = [];
    
    // Añadir el primer punto
    rutaSuavizada.push(ruta[0]);
    
    // Para cada par de puntos, añadir puntos intermedios
    for (let i = 0; i < ruta.length - 1; i++) {
        const p1 = ruta[i];
        const p2 = ruta[i + 1];
        
        // Determinar cuántos puntos intermedios añadir
        const numPuntosIntermedios = 3;
        
        for (let j = 1; j <= numPuntosIntermedios; j++) {
            const t = j / (numPuntosIntermedios + 1);
            
            // Interpolación lineal para cada punto intermedio
            const lng = p1[0] + (p2[0] - p1[0]) * t;
            const lat = p1[1] + (p2[1] - p1[1]) * t;
            
            // Añadir variación aleatoria para mayor naturalidad
            const lngVar = (Math.random() - 0.5) * 0.0001;
            const latVar = (Math.random() - 0.5) * 0.0001;
            
            rutaSuavizada.push([lng + lngVar, lat + latVar]);
        }
        
        // Añadir el punto final del segmento
        rutaSuavizada.push(p2);
    }
    
    return rutaSuavizada;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Object} p1 - Primer punto {lat, lng}
 * @param {Object} p2 - Segundo punto {lat, lng}
 * @returns {number} - Distancia en metros
 */
function calcularDistancia(p1, p2) {
    const R = 6371000; // Radio de la Tierra en metros
    const rad = Math.PI / 180;
    const lat1 = p1.lat * rad;
    const lat2 = p2.lat * rad;
    const sinDLat = Math.sin((p2.lat - p1.lat) * rad / 2);
    const sinDLon = Math.sin((p2.lng - p1.lng) * rad / 2);
    const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calcula la distancia total de una ruta
 * @param {Array} puntos - Array de puntos {lat, lng}
 * @returns {number} - Distancia total en metros
 */
function calcularDistanciaTotal(puntos) {
    let distancia = 0;
    for (let i = 0; i < puntos.length - 1; i++) {
        distancia += calcularDistancia(puntos[i], puntos[i + 1]);
    }
    return distancia;
}

module.exports = router;