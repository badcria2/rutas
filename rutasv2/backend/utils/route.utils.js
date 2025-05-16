/**
 * Funciones de utilidad para generar y manipular rutas
 */

// Importar utilidades geográficas
const geoUtils = require('./geo.utils');

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
    const distanciaDirecta = geoUtils.calcularDistanciaSimulada(origen, destino);
    
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
    const distanciaDirecta = geoUtils.calcularDistancia(origen, destino);
    
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

module.exports = {
    generarCoordenadasRealistasParaRuta,
    interpolacionCurva,
    generarCoordenadasNaturales,
    suavizarRuta,
    generarPuntosSeguridadSimulados,
    getTipoDescripcion,
    decodificarPolyline
};