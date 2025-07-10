/**
 * app.js
 * Controla la lógica principal de la aplicación y la interacción con el API
 */

// Modo de transporte actual (valor por defecto: auto)
let modoTransporteActual = 'driving-car';
const API_BASE_URL = 'https://rutas-fjqx.onrender.com/';

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    // Configurar eventos para los botones de modo de transporte
    configurarBotonesModoTransporte();

    // Configurar evento para el botón de búsqueda de rutas
    document.getElementById('buscar-ruta').addEventListener('click', obtenerRutaVisual);

    // Configurar eventos para el reporte de incidentes
    configurarModalReporteIncidentes();
    configurarInputsGeocoder();
});

/**
 * Obtiene y muestra una ruta visual natural entre los puntos seleccionados
 * Versión con debug completo para identificar problemas
 */
function obtenerRutaVisual() {
    // Obtener coordenadas de origen y destino
    const coordenadas = obtenerCoordenadasRuta();
    if (!coordenadas) return;

    console.log('=== DEBUG: COORDENADAS DE ENTRADA ===');
    console.log('Origen:', coordenadas.origen);
    console.log('Destino:', coordenadas.destino);
    console.log('Modo:', modoTransporteActual);

    // Mostrar mensaje de carga
    mostrarNotificacion('Calculando ruta...', 'info');

    // Preparar parámetros para la petición
    const params = new URLSearchParams({
        origen_lat: coordenadas.origen.lat,
        origen_lng: coordenadas.origen.lng,
        destino_lat: coordenadas.destino.lat,
        destino_lng: coordenadas.destino.lng,
        modo: modoTransporteActual
    });

    console.log('=== DEBUG: PARÁMETROS ENVIADOS ===');
    console.log('URL completa:', `${API_BASE_URL}/api/ruta-visual?${params}`);

    // Realizar petición al endpoint
    fetch(`${API_BASE_URL}/api/ruta-visual?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al obtener ruta visual: ${response.status}`);
            }
            return response.json();
        })
        .then(rutaData => {
            console.log('=== DEBUG: RESPUESTA COMPLETA DEL SERVIDOR ===');
            console.log(JSON.stringify(rutaData, null, 2));
            
            // Extraer las coordenadas para mostrar en el mapa
            let coordenadasRuta = null;
            
            // Intentar obtener coordenadas de diferentes formatos
            if (rutaData.ruta.caracteristicas && rutaData.ruta.caracteristicas.length > 0) {
                coordenadasRuta = rutaData.ruta.caracteristicas[0].geometria.coordenadas;
                console.log('=== DEBUG: USANDO FORMATO CARACTERISTICAS ===');
            } else if (rutaData.ruta.geometry && rutaData.ruta.geometry.coordinates) {
                coordenadasRuta = rutaData.ruta.geometry.coordinates;
                console.log('=== DEBUG: USANDO FORMATO GEOMETRY ===');
            }
            
            if (!coordenadasRuta || !Array.isArray(coordenadasRuta)) {
                throw new Error('No se encontraron coordenadas válidas en la respuesta');
            }
            
            console.log('=== DEBUG: COORDENADAS EXTRAÍDAS ===');
            console.log('Total de puntos:', coordenadasRuta.length);
            console.log('Primeras 5 coordenadas:', coordenadasRuta.slice(0, 5));
            console.log('Últimas 5 coordenadas:', coordenadasRuta.slice(-5));
            
            // Analizar el formato de las coordenadas
            const primeraCoord = coordenadasRuta[0];
            const ultimaCoord = coordenadasRuta[coordenadasRuta.length - 1];
            
            console.log('=== DEBUG: ANÁLISIS DE COORDENADAS ===');
            console.log('Primera coordenada:', primeraCoord);
            console.log('Última coordenada:', ultimaCoord);
            
            // Verificar rangos válidos
            const esLatitudValida = (val) => val >= -90 && val <= 90;
            const esLongitudValida = (val) => val >= -180 && val <= 180;
            
            let formatoDetectado = 'DESCONOCIDO';
            let puntosParaLeaflet = [];
            
            if (Array.isArray(primeraCoord) && primeraCoord.length >= 2) {
                const val1 = primeraCoord[0];
                const val2 = primeraCoord[1];
                
                console.log('Valor 1:', val1, 'Es latitud válida:', esLatitudValida(val1), 'Es longitud válida:', esLongitudValida(val1));
                console.log('Valor 2:', val2, 'Es latitud válida:', esLatitudValida(val2), 'Es longitud válida:', esLongitudValida(val2));
                
                // Para Lima, Perú: latitud ≈ -12, longitud ≈ -77
                if (val1 >= -13 && val1 <= -11 && val2 >= -78 && val2 <= -76) {
                    // Formato [lat, lng] - ya correcto para Leaflet
                    formatoDetectado = '[LAT, LNG]';
                    puntosParaLeaflet = coordenadasRuta;
                } else if (val2 >= -13 && val2 <= -11 && val1 >= -78 && val1 <= -76) {
                    // Formato [lng, lat] - necesita conversión
                    formatoDetectado = '[LNG, LAT]';
                    puntosParaLeaflet = coordenadasRuta.map(coord => [coord[1], coord[0]]);
                } else {
                    // Fallback: asumir formato OpenRouteService [lng, lat]
                    formatoDetectado = '[LNG, LAT] (FALLBACK)';
                    puntosParaLeaflet = coordenadasRuta.map(coord => [coord[1], coord[0]]);
                }
            }
            
            console.log('=== DEBUG: CONVERSIÓN DE COORDENADAS ===');
            console.log('Formato detectado:', formatoDetectado);
            console.log('Primeras 3 coordenadas convertidas:', puntosParaLeaflet.slice(0, 3));
            console.log('Últimas 3 coordenadas convertidas:', puntosParaLeaflet.slice(-3));
            
            // Verificar que las coordenadas convertidas estén en rangos válidos para Lima
            const coordsValidasParaLima = puntosParaLeaflet.every(punto => {
                const lat = punto[0];
                const lng = punto[1];
                return lat >= -15 && lat <= -10 && lng >= -80 && lng <= -75;
            });
            
            console.log('=== DEBUG: VALIDACIÓN FINAL ===');
            console.log('¿Coordenadas válidas para Lima?', coordsValidasParaLima);
            
            if (!coordsValidasParaLima) {
                console.error('¡ADVERTENCIA! Las coordenadas están fuera del rango esperado para Lima');
                console.log('Esto explicaría por qué las líneas aparecen fuera del mapa');
                
                // Mostrar algunas coordenadas que están fuera del rango
                const coordsFueras = puntosParaLeaflet.filter(punto => {
                    const lat = punto[0];
                    const lng = punto[1];
                    return !(lat >= -15 && lat <= -10 && lng >= -80 && lng <= -75);
                });
                console.log('Coordenadas fuera del rango de Lima:', coordsFueras.slice(0, 5));
            }
            
            // === DEBUG ADICIONAL PARA EL MAPA ===
            console.log('=== DEBUG: ANTES DE MOSTRAR RUTA ===');
            console.log('Puntos para Leaflet:', puntosParaLeaflet);
            console.log('Centro actual del mapa:', map.getCenter());
            console.log('Zoom actual del mapa:', map.getZoom());
            console.log('Bounds actuales del mapa:', map.getBounds());
            
            // Verificar si existe la función mostrarRuta
            console.log('¿Existe mostrarRuta?', typeof mostrarRuta);
            
            // Usar función debug de mostrarRuta
            mostrarRutaDebug(puntosParaLeaflet, '#3388ff');
            
            // Si tenemos límites (bounds), ajustar la vista
            if (rutaData.ruta.bounds && Array.isArray(rutaData.ruta.bounds) && rutaData.ruta.bounds.length === 4) {
                console.log('=== DEBUG: BOUNDS ORIGINALES ===');
                console.log('Bounds:', rutaData.ruta.bounds);
                
                const bounds = [
                    [rutaData.ruta.bounds[1], rutaData.ruta.bounds[0]], // [lat, lng] Suroeste
                    [rutaData.ruta.bounds[3], rutaData.ruta.bounds[2]]  // [lat, lng] Noreste
                ];
                
                console.log('Bounds convertidos para Leaflet:', bounds);
                map.fitBounds(bounds, { padding: [50, 50] });
            } else {
                console.log('=== DEBUG: CALCULANDO BOUNDS AUTOMÁTICAMENTE ===');
                // No hacer nada aquí, la función mostrarRutaDebug ya ajusta la vista
            }
            
            // Verificación post-render
            setTimeout(() => {
                console.log('=== DEBUG: VERIFICACIÓN POST-RENDER ===');
                console.log('Capas en el mapa:', map._layers);
                
                // Buscar polylines en las capas del mapa
                const polylines = [];
                map.eachLayer(layer => {
                    if (layer instanceof L.Polyline) {
                        polylines.push(layer);
                        console.log('Polyline encontrada:', layer);
                        console.log('Bounds de la polyline:', layer.getBounds());
                    }
                });
                
                console.log('Total polylines en el mapa:', polylines.length);
                
                if (polylines.length === 0) {
                    console.error('¡NO HAY POLYLINES EN EL MAPA!');
                }
            }, 1000);
            
            // Mostrar puntos de seguridad cercanos a la ruta
            if (rutaData.puntosSeguridad && Array.isArray(rutaData.puntosSeguridad)) {
                mostrarPuntosSeguridadEnRuta(rutaData.puntosSeguridad);
            }
            
            // Actualizar la información de la ruta
            actualizarInformacionRuta(rutaData.ruta);
            
            // Mostrar el panel de información
            document.getElementById('route-info').classList.remove('hidden');
            
            // Mostrar notificación de éxito
            mostrarNotificacion('Ruta calculada con éxito', 'success');
        })
        .catch(error => {
            console.error('=== DEBUG: ERROR ===', error);
            mostrarNotificacion('No se pudo obtener la ruta. Intente nuevamente.', 'error');
        });
}

/**
 * Función debug para mostrar rutas con logging detallado
 * @param {Array} puntos - Array de coordenadas [lat, lng]
 * @param {string} color - Color de la línea
 */
function mostrarRutaDebug(puntos, color) {
    console.log('=== DEBUG: DENTRO DE mostrarRutaDebug() ===');
    console.log('Puntos recibidos:', puntos);
    console.log('Color:', color);
    console.log('Cantidad de puntos:', puntos.length);
    
    // Verificar que el mapa existe
    if (!window.map) {
        console.error('¡ERROR! No existe window.map');
        return;
    }
    
    // Limpiar rutas anteriores si existe la variable
    if (window.rutaActual) {
        console.log('Eliminando ruta anterior');
        map.removeLayer(window.rutaActual);
    }
    
    try {
        // Crear la polyline
        console.log('Creando polyline...');
        window.rutaActual = L.polyline(puntos, {
            color: color,
            weight: 5,
            opacity: 0.7
        });
        
        console.log('Polyline creada:', window.rutaActual);
        
        // Agregar al mapa
        console.log('Agregando polyline al mapa...');
        window.rutaActual.addTo(map);
        
        console.log('Polyline agregada al mapa');
        
        // Verificar bounds de la polyline
        const polylineBounds = window.rutaActual.getBounds();
        console.log('Bounds de la polyline:', polylineBounds);
        
        // Ajustar vista del mapa a la ruta
        console.log('Ajustando vista del mapa...');
        map.fitBounds(polylineBounds, { padding: [20, 20] });
        
        console.log('Vista ajustada. Nuevo centro:', map.getCenter());
        console.log('Nuevo zoom:', map.getZoom());
        
    } catch (error) {
        console.error('ERROR en mostrarRutaDebug:', error);
    }
}

/**
 * Configura los botones para cambiar el modo de transporte
 */
function configurarBotonesModoTransporte() {
    const botones = document.querySelectorAll('.modo-transporte');

    botones.forEach(boton => {
        boton.addEventListener('click', function () {
            // Eliminar clase activo de todos los botones
            botones.forEach(b => b.classList.remove('activo'));

            // Añadir clase activo al botón seleccionado
            this.classList.add('activo');

            // Actualizar el modo de transporte actual
            modoTransporteActual = this.getAttribute('data-modo');

            console.log(`Modo de transporte cambiado a: ${modoTransporteActual}`);

            // Si ya hay origen y destino, actualizar la ruta
            if (marcadorOrigen && marcadorDestino) {
                obtenerRutaVisual();
            }
        });
    });
}

/**
 * Configura el modal para reportar incidentes
 */
function configurarModalReporteIncidentes() {
    // Botón para abrir el modal
    const btnReporte = document.getElementById('report-button');
    btnReporte.addEventListener('click', function () {
        // Mensaje explicativo cuando no hay ubicación seleccionada
        mostrarNotificacion('Haz clic derecho en el mapa para seleccionar la ubicación del incidente', 'info');
    });

    // Botón para cerrar el modal
    const btnCerrar = document.querySelector('.modal .close');
    btnCerrar.addEventListener('click', function () {
        document.getElementById('report-incident').classList.add('hidden');
    });

    // Formulario de reporte
    const formulario = document.getElementById('incident-form');
    formulario.addEventListener('submit', function (e) {
        e.preventDefault();
        enviarReporteIncidente();
    });
}

/**
 * Actualiza la información de la ruta en la interfaz
 * @param {Object} rutaData - Datos de la ruta
 */
function actualizarInformacionRuta(rutaData) {
    const detallesElemento = document.getElementById('route-details');

    // Formatear la distancia (convertir de metros a km)
    let distanciaKm;
    if (rutaData.propiedades && rutaData.propiedades.distancia) {
        distanciaKm = (rutaData.propiedades.distancia / 1000).toFixed(1);
    } else if (rutaData.summary && rutaData.summary.distance) {
        distanciaKm = (rutaData.summary.distance / 1000).toFixed(1);
    } else {
        distanciaKm = '0.0';
    }

    // Formatear el tiempo (convertir de segundos a minutos)
    let tiempoMinutos;
    if (rutaData.propiedades && rutaData.propiedades.duracion) {
        tiempoMinutos = Math.round(rutaData.propiedades.duracion / 60);
    } else if (rutaData.summary && rutaData.summary.duration) {
        tiempoMinutos = Math.round(rutaData.summary.duration / 60);
    } else {
        tiempoMinutos = 0;
    }

    // Obtener texto del modo de transporte
    let modoTexto;
    switch (modoTransporteActual) {
        case 'driving-car': modoTexto = 'Auto'; break;
        case 'foot-walking': modoTexto = 'A pie'; break;
        case 'cycling-regular': modoTexto = 'Bicicleta'; break;
        default: modoTexto = 'Desconocido';
    }

    // Actualizar el HTML con la información
    detallesElemento.innerHTML = `
        <div class="route-detail-item">
            <i class="fas fa-ruler"></i> Distancia: <strong>${distanciaKm} km</strong>
        </div>
        <div class="route-detail-item">
            <i class="fas fa-clock"></i> Tiempo estimado: <strong>${tiempoMinutos} minutos</strong>
        </div>
        <div class="route-detail-item">
            <i class="fas fa-road"></i> Modo: <strong>${modoTexto}</strong>
        </div>
    `;

    // Actualizar la barra de seguridad
    const nivelSeguridad = rutaData.seguridadScore || 75; // Por defecto 75% si no hay dato
    const nivelSeguridadElemento = document.getElementById('security-level');
    nivelSeguridadElemento.style.width = `${nivelSeguridad}%`;

    // Cambiar color según nivel de seguridad
    if (nivelSeguridad >= 80) {
        nivelSeguridadElemento.style.backgroundColor = '#4CAF50'; // Verde
    } else if (nivelSeguridad >= 50) {
        nivelSeguridadElemento.style.backgroundColor = '#FFC107'; // Amarillo
    } else {
        nivelSeguridadElemento.style.backgroundColor = '#F44336'; // Rojo
    }
}

/**
 * Envía el reporte de incidente al servidor
 */
function enviarReporteIncidente() {
    // Verificar que se haya seleccionado una ubicación
    if (!window.incidenteLatLng) {
        mostrarNotificacion('Debe seleccionar una ubicación en el mapa', 'error');
        return;
    }

    // Obtener datos del formulario
    const tipoIncidente = document.getElementById('incident-type').value;
    const descripcion = document.getElementById('incident-description').value;
    const fecha = document.getElementById('incident-date').value;

    // Crear objeto con los datos del incidente
    const datosIncidente = {
        tipo: tipoIncidente,
        descripcion: descripcion,
        fecha: fecha,
        ubicacion: {
            lat: window.incidenteLatLng.lat,
            lng: window.incidenteLatLng.lng
        }
    };

    // Enviar datos al servidor
    fetch(`${API_BASE_URL}/api/incidentes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosIncidente)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al reportar el incidente');
            }
            return response.json();
        })
        .then(data => {
            // Cerrar el modal
            document.getElementById('report-incident').classList.add('hidden');

            // Mostrar notificación de éxito
            mostrarNotificacion('Incidente reportado con éxito. Gracias por contribuir.', 'success');

            // Resetear el formulario
            document.getElementById('incident-form').reset();

            // Resetear la ubicación temporal
            window.incidenteLatLng = null;

            // Recargar los incidentes para reflejar el nuevo reporte
            cargarIncidentes();
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('No se pudo reportar el incidente. Intente nuevamente.', 'error');
        });
}

/**
 * Configura los inputs  
 */
function configurarInputsGeocoder() {
    const inputOrigen = document.getElementById('origen');
    const inputDestino = document.getElementById('destino');

    // Asegurar que estamos mostrando el ícono correcto
    const contenedorOrigen = inputOrigen.parentElement;
    const contenedorDestino = inputDestino.parentElement;

    // Cambiar el ícono para que se vea más como el de Leaflet Control Geocoder
    contenedorOrigen.querySelector('i').className = 'fas fa-search';
    contenedorDestino.querySelector('i').className = 'fas fa-search';

    // Añadir placeholder similares a los de index2.html
    inputOrigen.placeholder = 'Buscar punto de inicio...';
    inputDestino.placeholder = 'Buscar destino...';

    // Cuando se presiona Enter en un input, activa la búsqueda
    inputOrigen.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Usar la función de geocodificación de Leaflet si está disponible
            if (window.geocoderStart) {
                if (typeof geocoderStart.geocode === 'function') {
                    geocoderStart.geocode(this.value);
                } else if (typeof geocoderStart._geocode === 'function') {
                    geocoderStart._geocode(this.value);
                } else {
                    // Alternativa: usar directamente el geocoder base
                    geocoder.geocode(this.value, results => {
                        if (results && results.length > 0) {
                            const result = results[0];
                            const event = {
                                geocode: result
                            };
                            geocoderStart.fire('markgeocode', event);
                        }
                    });
                }
            }
        }
    });

    inputDestino.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Usar la función de geocodificación de Leaflet si está disponible
            if (window.geocoderEnd) {
                if (typeof geocoderStart.geocode === 'function') {
                    geocoderStart.geocode(this.value);
                } else if (typeof geocoderStart._geocode === 'function') {
                    geocoderStart._geocode(this.value);
                } else {
                    // Alternativa: usar directamente el geocoder base
                    geocoder.geocode(this.value, results => {
                        if (results && results.length > 0) {
                            const result = results[0];
                            const event = {
                                geocode: result
                            };
                            geocoderStart.fire('markgeocode', event);
                        }
                    });
                }
            }
        }
    });

    // Añadir más estilos dinámicamente para que se parezcan más a los de index2.html
    const style = document.createElement('style');
    style.textContent = `
        .input-group {
            position: relative;
        }
        .input-group input {
            transition: border-color 0.2s ease-in-out;
        }
        .input-group input:focus {
            border-color: #3388ff;
            box-shadow: 0 0 0 3px rgba(51, 136, 255, 0.25);
        }
        .input-group i {
            z-index: 5;
        }
        /* Estilo para cuando se está realizando una búsqueda */
        .input-group.searching input {
            background-color: #f5f5f5;
        }
    `;
    document.head.appendChild(style);
}
