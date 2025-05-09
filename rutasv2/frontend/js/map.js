/**
 * map.js
 * Encargado de la inicialización y manipulación del mapa usando Leaflet.js
 */

// Objeto global del mapa
let map;
// Capas de marcadores para origen, destino y puntos de seguridad
let marcadorOrigen, marcadorDestino;
// Geocoder para búsqueda de direcciones
let geocoder;
// Capa para mostrar las rutas
let rutaLayer = null;
// Capa para puntos de seguridad
let securityPointsLayer = null;

/**
 * Inicializa el mapa con Leaflet.js
 */
function inicializarMapa() {
    // Coordenadas centrales de Lima, Perú
    const limaCentro = [-12.0464, -77.0428];
    const zoomInicial = 13;

    // Inicializar el mapa
    map = L.map('map').setView(limaCentro, zoomInicial);

    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Inicializar el geocoder para búsqueda de direcciones
    inicializarGeocoder();

    // Añadir control de escala
    L.control.scale({
        imperial: false,  // Solo mostrar escala métrica
        position: 'bottomright'
    }).addTo(map);

    // Inicializar la capa de puntos de seguridad
    securityPointsLayer = L.layerGroup().addTo(map);
    
    // Inicializar la capa de incidentes
    incidentesLayer = L.layerGroup().addTo(map);

    // Añadir manejador de eventos para reportar incidentes haciendo clic en el mapa
    map.on('contextmenu', function(e) {
        // Guardar coordenadas temporalmente para el reporte de incidentes
        window.tempIncidentLocation = e.latlng;
        
        // Mostrar un popup con opción para reportar incidente
        L.popup()
            .setLatLng(e.latlng)
            .setContent('<button id="reportHereBtn" class="btn-report-here">Reportar incidente aquí</button>')
            .openOn(map);
        
        // Agregar evento al botón del popup
        document.getElementById('reportHereBtn').addEventListener('click', function() {
            // Cerrar el popup y abrir el modal de reporte
            map.closePopup();
            abrirModalReporte(e.latlng);
        });
    });

    // Cargar puntos de seguridad iniciales
    cargarPuntosSeguridadIniciales();
    
    // Cargar incidentes iniciales
    cargarIncidentes();
    
    // Actualizar incidentes cuando el mapa se mueva significativamente
    map.on('moveend', function() {
        if (map.getZoom() > 12) {
            cargarIncidentes();
        }
    });
    
    habilitarSeleccionPuntosEnMapa();
    agregarBotonesUbicacionesPredefinidas();
    console.log('Mapa inicializado correctamente');
}
// Añade esta función en tu archivo map.js después de inicializarMapa()
function habilitarSeleccionPuntosEnMapa() {
    // Variable para rastrear qué punto estamos seleccionando
    let seleccionandoPunto = 'origen'; // 'origen' o 'destino'
    
    // Crear un panel de control para selección
    const panelControl = document.createElement('div');
    panelControl.className = 'panel-seleccion-puntos';
    panelControl.style.position = 'absolute';
    panelControl.style.top = '10px';
    panelControl.style.right = '10px';
    panelControl.style.backgroundColor = 'white';
    panelControl.style.padding = '10px';
    panelControl.style.borderRadius = '5px';
    panelControl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    panelControl.style.zIndex = '1000';
    
    // Añadir título
    const titulo = document.createElement('div');
    titulo.textContent = 'Seleccionar puntos en el mapa';
    titulo.style.fontWeight = 'bold';
    titulo.style.marginBottom = '8px';
    panelControl.appendChild(titulo);
    
    // Añadir botones de selección
    const btnOrigen = document.createElement('button');
    btnOrigen.textContent = '📍 Seleccionar Origen';
    btnOrigen.style.padding = '5px 10px';
    btnOrigen.style.marginRight = '5px';
    btnOrigen.style.backgroundColor = '#4CAF50';
    btnOrigen.style.color = 'white';
    btnOrigen.style.border = 'none';
    btnOrigen.style.borderRadius = '3px';
    btnOrigen.style.cursor = 'pointer';
    btnOrigen.style.marginBottom = '5px';
    btnOrigen.addEventListener('click', () => {
        seleccionandoPunto = 'origen';
        btnOrigen.style.backgroundColor = '#4CAF50';
        btnDestino.style.backgroundColor = '#888';
        mensajeAyuda.textContent = '👆 Haz clic en el mapa para seleccionar el punto de ORIGEN';
    });
    panelControl.appendChild(btnOrigen);
    
    const btnDestino = document.createElement('button');
    btnDestino.textContent = '🏁 Seleccionar Destino';
    btnDestino.style.padding = '5px 10px';
    btnDestino.style.backgroundColor = '#888';
    btnDestino.style.color = 'white';
    btnDestino.style.border = 'none';
    btnDestino.style.borderRadius = '3px';
    btnDestino.style.cursor = 'pointer';
    btnDestino.addEventListener('click', () => {
        seleccionandoPunto = 'destino';
        btnDestino.style.backgroundColor = '#4CAF50';
        btnOrigen.style.backgroundColor = '#888';
        mensajeAyuda.textContent = '👆 Haz clic en el mapa para seleccionar el punto de DESTINO';
    });
    panelControl.appendChild(btnDestino);
    
    // Mensaje de ayuda
    const mensajeAyuda = document.createElement('div');
    mensajeAyuda.textContent = '👆 Haz clic en el mapa para seleccionar el punto de ORIGEN';
    mensajeAyuda.style.marginTop = '8px';
    mensajeAyuda.style.fontSize = '0.9em';
    mensajeAyuda.style.color = '#333';
    panelControl.appendChild(mensajeAyuda);
    
    // Añadir al DOM
    document.getElementById('map').appendChild(panelControl);
    
    // Añadir evento de clic al mapa
    map.on('click', function(e) {
        // Obtener coordenadas del clic
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        console.log(`Punto seleccionado: ${seleccionandoPunto} - Lat: ${lat}, Lng: ${lng}`);
        
        // Eliminar marcador existente si hay uno
        if (seleccionandoPunto === 'origen' && marcadorOrigen) {
            map.removeLayer(marcadorOrigen);
        } else if (seleccionandoPunto === 'destino' && marcadorDestino) {
            map.removeLayer(marcadorDestino);
        }
        
        // Crear un nuevo marcador
        const nuevoMarcador = L.marker([lat, lng], {
            draggable: true, // Para permitir ajuste manual
            title: seleccionandoPunto === 'origen' ? 'Punto de origen' : 'Punto de destino'
        });
        
        // Añadir popup con información
        nuevoMarcador.bindPopup(`<b>${seleccionandoPunto === 'origen' ? 'Origen' : 'Destino'}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
        
        // Actualizar campo de texto correspondiente con geocodificación inversa
        geocoder.reverse(e.latlng, map.options.crs.scale(map.getZoom()), results => {
            const ubicacion = results && results.length > 0 ? results[0].name : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            document.getElementById(seleccionandoPunto).value = ubicacion;
        });
        
        // Actualizar marcador global
        if (seleccionandoPunto === 'origen') {
            marcadorOrigen = nuevoMarcador;
        } else {
            marcadorDestino = nuevoMarcador;
        }
        
        // Añadir el marcador al mapa
        nuevoMarcador.addTo(map);
        nuevoMarcador.openPopup();
        
        // Cambiar automáticamente a seleccionar el otro punto si es necesario
        if ((seleccionandoPunto === 'origen' && !marcadorDestino) || 
            (seleccionandoPunto === 'destino' && !marcadorOrigen)) {
            // Cambiar modo de selección
            seleccionandoPunto = seleccionandoPunto === 'origen' ? 'destino' : 'origen';
            
            // Actualizar UI
            if (seleccionandoPunto === 'origen') {
                btnOrigen.style.backgroundColor = '#4CAF50';
                btnDestino.style.backgroundColor = '#888';
                mensajeAyuda.textContent = '👆 Haz clic en el mapa para seleccionar el punto de ORIGEN';
            } else {
                btnDestino.style.backgroundColor = '#4CAF50';
                btnOrigen.style.backgroundColor = '#888';
                mensajeAyuda.textContent = '👆 Haz clic en el mapa para seleccionar el punto de DESTINO';
            }
        }
        
        // Ajustar la vista si hay ambos puntos
        if (marcadorOrigen && marcadorDestino) {
            ajustarVistaMapa();
        }
    });
}

// Llama a esta función al final de inicializarMapa() 

function obtenerCoordenadasRuta() {
    if (!marcadorOrigen && !marcadorDestino) {
        mostrarNotificacion('Debe seleccionar un punto de origen y destino', 'error');
        console.log('Faltan ambos puntos: origen y destino');
        return null;
    } else if (!marcadorOrigen) {
        mostrarNotificacion('Debe seleccionar un punto de origen', 'error');
        console.log('Falta el punto de origen');
        return null;
    } else if (!marcadorDestino) {
        mostrarNotificacion('Debe seleccionar un punto de destino', 'error');
        console.log('Falta el punto de destino');
        return null;
    }

    console.log('Coordenadas de origen:', marcadorOrigen.getLatLng());
    console.log('Coordenadas de destino:', marcadorDestino.getLatLng());

    return {
        origen: {
            lat: marcadorOrigen.getLatLng().lat,
            lng: marcadorOrigen.getLatLng().lng
        },
        destino: {
            lat: marcadorDestino.getLatLng().lat,
            lng: marcadorDestino.getLatLng().lng
        }
    };
}
// Función para añadir botones de ubicaciones predefinidas
function agregarBotonesUbicacionesPredefinidas() {
    const ubicaciones = [
        { nombre: "Miraflores", lat: -12.1186, lng: -77.0318 },
        { nombre: "San Isidro", lat: -12.1050, lng: -77.0380 },
        { nombre: "Barranco", lat: -12.1400, lng: -77.0270 },
        { nombre: "San Borja", lat: -12.1089, lng: -77.0047 }
    ];
    
    const btnDemo = document.createElement('button');
    btnDemo.textContent = '🚀 Cargar ejemplo';
    btnDemo.style.position = 'absolute';
    btnDemo.style.bottom = '20px';
    btnDemo.style.right = '10px';
    btnDemo.style.padding = '8px 15px';
    btnDemo.style.backgroundColor = '#2196F3';
    btnDemo.style.color = 'white';
    btnDemo.style.border = 'none';
    btnDemo.style.borderRadius = '4px';
    btnDemo.style.cursor = 'pointer';
    btnDemo.style.zIndex = '1000';
    btnDemo.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    btnDemo.addEventListener('click', function() {
        // Limpiar marcadores existentes
        if (marcadorOrigen) map.removeLayer(marcadorOrigen);
        if (marcadorDestino) map.removeLayer(marcadorDestino);
        
        // Crear origen en Miraflores
        const origen = ubicaciones[0];
        marcadorOrigen = L.marker([origen.lat, origen.lng], {
            draggable: true,
            title: 'Origen: ' + origen.nombre
        }).addTo(map);
        document.getElementById('origen').value = origen.nombre;
        
        // Crear destino en San Isidro
        const destino = ubicaciones[1];
        marcadorDestino = L.marker([destino.lat, destino.lng], {
            draggable: true,
            title: 'Destino: ' + destino.nombre
        }).addTo(map);
        document.getElementById('destino').value = destino.nombre;
        
        // Ajustar vista
        ajustarVistaMapa();
        
        // Mostrar notificación
        mostrarNotificacion('Ejemplo cargado. Ahora puedes buscar la ruta.', 'success');
    });
    
    document.getElementById('map').appendChild(btnDemo);
}
 

/**
 * Inicializa el geocoder para búsqueda de direcciones
 */
function inicializarGeocoder() {
    // Inicializar el geocoder de Leaflet Control Geocoder
    geocoder = L.Control.Geocoder.nominatim({
        geocodingQueryParams: {
            countrycodes: 'pe',  // Limitar búsqueda a Perú
            viewbox: '-78,-11,-76,-13',  // Aproximado para área de Lima
            bounded: 1
        }
    });

    // Agregar autocompletado a los campos de origen y destino
    const origenInput = document.getElementById('origen');
    const destinoInput = document.getElementById('destino');

    // Configurar evento input para autocompletado de origen
    origenInput.addEventListener('input', function() {
        gestionarAutocompletado(this, 'origen');
    });

    // Configurar evento input para autocompletado de destino
    destinoInput.addEventListener('input', function() {
        gestionarAutocompletado(this, 'destino');
    });
}

/**
 * Gestiona el autocompletado de direcciones
 * @param {HTMLInputElement} inputElement - El elemento input que está siendo modificado
 * @param {string} tipo - 'origen' o 'destino'
 */
function gestionarAutocompletado(inputElement, tipo) {
    // Verificar que haya al menos 3 caracteres para comenzar la búsqueda
    if (inputElement.value.length < 3) return;

    // Realizar la búsqueda con el geocoder
    geocoder.geocode(inputElement.value + ', Lima, Perú', function(results) {
        // Limpiar cualquier lista de sugerencias existente
        let suggestionsContainer = document.querySelector(`.suggestions-${tipo}`);
        if (suggestionsContainer) {
            suggestionsContainer.remove();
        }

        // Si no hay resultados, salir
        if (!results || results.length === 0) return;

        // Crear contenedor de sugerencias
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = `suggestions-${tipo}`;
        suggestionsContainer.style.position = 'absolute';
        suggestionsContainer.style.width = `${inputElement.offsetWidth}px`;
        suggestionsContainer.style.top = `${inputElement.offsetTop + inputElement.offsetHeight}px`;
        suggestionsContainer.style.left = `${inputElement.offsetLeft}px`;
        suggestionsContainer.style.backgroundColor = '#fff';
        suggestionsContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        suggestionsContainer.style.borderRadius = '4px';
        suggestionsContainer.style.zIndex = '1000';

        // Añadir cada resultado como una opción
        results.slice(0, 5).forEach(function(result) {
            const suggestion = document.createElement('div');
            suggestion.textContent = result.name;
            suggestion.style.padding = '10px';
            suggestion.style.borderBottom = '1px solid #eee';
            suggestion.style.cursor = 'pointer';

            suggestion.addEventListener('click', function() {
                // Establecer el valor seleccionado en el input
                inputElement.value = result.name;
                
                // Si ya existe un marcador para este tipo, eliminarlo
                if (tipo === 'origen' && marcadorOrigen) {
                    map.removeLayer(marcadorOrigen);
                } else if (tipo === 'destino' && marcadorDestino) {
                    map.removeLayer(marcadorDestino);
                }

                // Crear un nuevo marcador para la ubicación seleccionada
                const marcador = L.marker(result.center, {
                    draggable: true,  // Permitir arrastrar para ajustar posición
                    title: result.name
                });

                // Establecer el marcador global
                if (tipo === 'origen') {
                    marcadorOrigen = marcador;
                } else {
                    marcadorDestino = marcador;
                }

                // Añadir el marcador al mapa
                marcador.addTo(map);
                
                // Ajustar la vista del mapa para incluir el nuevo marcador
                ajustarVistaMapa();

                // Eliminar las sugerencias
                suggestionsContainer.remove();
            });

            // Cambiar estilo al pasar el mouse
            suggestion.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
            });

            suggestion.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#fff';
            });

            suggestionsContainer.appendChild(suggestion);
        });

        // Añadir el contenedor de sugerencias al DOM
        inputElement.parentNode.appendChild(suggestionsContainer);

        // Cerrar las sugerencias al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!suggestionsContainer.contains(e.target) && e.target !== inputElement) {
                suggestionsContainer.remove();
            }
        });
    });
}

/**
 * Ajusta la vista del mapa para mostrar origen y destino
 */
function ajustarVistaMapa() {
    // Si tenemos origen y destino, ajustar vista para mostrar ambos
    if (marcadorOrigen && marcadorDestino) {
        const grupo = L.featureGroup([marcadorOrigen, marcadorDestino]);
        map.fitBounds(grupo.getBounds().pad(0.3)); // Añadir padding del 30%
    }
    // Si solo tenemos origen o destino, centrar en ese punto
    else if (marcadorOrigen) {
        map.setView(marcadorOrigen.getLatLng(), 15);
    }
    else if (marcadorDestino) {
        map.setView(marcadorDestino.getLatLng(), 15);
    }
}

/**
 * Obtiene las coordenadas de los puntos de origen y destino
 * @returns {Object|null} Objeto con las coordenadas o null si faltan datos
 */
function obtenerCoordenadasRuta() {
    if (!marcadorOrigen || !marcadorDestino) {
        mostrarNotificacion('Debe seleccionar un punto de origen y destino', 'error');
        return null;
    }

    return {
        origen: {
            lat: marcadorOrigen.getLatLng().lat,
            lng: marcadorOrigen.getLatLng().lng
        },
        destino: {
            lat: marcadorDestino.getLatLng().lat,
            lng: marcadorDestino.getLatLng().lng
        }
    };
}
 /**
 * Muestra una ruta en el mapa con estilo mejorado
 * @param {Array} rutaGeometry - Array de puntos [lat, lng] que forman la ruta
 * @param {string} colorRuta - Color de la ruta en formato hex
 */
/**
 * Muestra una ruta en el mapa con estilo mejorado y animación
 * @param {Array} rutaGeometry - Array de puntos [lat, lng] que forman la ruta
 * @param {string} colorRuta - Color de la ruta en formato hex
 */
  
function obtenerRutaVisual() {
    // Obtener coordenadas de origen y destino
    const coordenadas = obtenerCoordenadasRuta();
    if (!coordenadas) return;
    
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
    
    // Realizar petición al nuevo endpoint
    fetch(`${API_BASE_URL}/api/ruta-visual?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al obtener ruta visual: ${response.status}`);
            }
            return response.json();
        })
        .then(rutaData => {
            // Extraer las coordenadas para mostrar en el mapa
            if (rutaData.caracteristicas && rutaData.caracteristicas.length > 0) {
                const coordenadasRuta = rutaData.caracteristicas[0].geometria.coordenadas;
                
                // Convertir formato [lng, lat] a [lat, lng] para Leaflet
                const puntos = coordenadasRuta.map(coord => [coord[1], coord[0]]);
                
                // Mostrar la ruta en el mapa
                mostrarRuta(puntos, '#3388ff');
                
                // Si tenemos límites (bounds), ajustar la vista
                if (rutaData.bounds) {
                    const bounds = [
                        [rutaData.bounds[1], rutaData.bounds[0]], // [lat, lng] Suroeste
                        [rutaData.bounds[3], rutaData.bounds[2]]  // [lat, lng] Noreste
                    ];
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
                
                // Mostrar notificación de éxito
                mostrarNotificacion('Ruta calculada con éxito', 'success');
            } else {
                throw new Error('Formato de ruta inválido en la respuesta');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('No se pudo obtener la ruta. Intente nuevamente.', 'error');
        });
}

/**
 * Muestra una ruta en el mapa con estilo mejorado y animación
 * Función optimizada que solo se enfoca en la visualización
 * @param {Array} puntos - Array de puntos [lat, lng] que forman la ruta
 * @param {string} colorRuta - Color de la ruta en formato hex
 */
function mostrarRuta(puntos, colorRuta = '#3388ff') {
    // Si ya existe una ruta, eliminarla
    if (rutaLayer) {
        map.removeLayer(rutaLayer);
    }

    // Crear capa de grupos para contener todos los elementos de la ruta
    rutaLayer = L.layerGroup().addTo(map);
    
    // 1. Crear una línea de "sombra" para dar profundidad
    const lineaSombra = L.polyline(puntos, {
        color: '#000',
        weight: 9,
        opacity: 0.2,
        lineJoin: 'round',
        lineCap: 'round'
    }).addTo(rutaLayer);
    
    // 2. Crear la línea principal de la ruta
    const lineaPrincipal = L.polyline(puntos, {
        color: colorRuta,
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
    }).addTo(rutaLayer);
    
    // 3. Crear una línea de "brillo" para efecto 3D
    const lineaBrillo = L.polyline(puntos, {
        color: '#fff',
        weight: 2,
        opacity: 0.4,
        lineJoin: 'round',
        lineCap: 'round'
    }).addTo(rutaLayer);
    
    // Ajustar el orden de las capas para una visualización correcta
    lineaSombra.bringToBack();
    lineaPrincipal.bringToFront();
    lineaBrillo.bringToFront();
    
    // Añadir marcadores de inicio y fin con estilo profesional
    if (puntos.length > 1) {
        const puntoInicio = puntos[0];
        const puntoFin = puntos[puntos.length - 1];
        agregarMarcadoresRuta(puntoInicio, puntoFin);
    }
    
    // Añadir flechas de dirección a lo largo de la ruta
    agregarFlechasDireccion(puntos, colorRuta);
    
    // Animar la aparición de la ruta
    animarRuta(lineaPrincipal);
}

/**
 * Agrega marcadores de origen y destino a la ruta
 * @param {Array} inicio - Punto de inicio [lat, lng]
 * @param {Array} fin - Punto de fin [lat, lng]
 */
function agregarMarcadoresRuta(inicio, fin) {
    // Icono para el punto de inicio (círculo verde con efecto)
    const iconoInicio = L.divIcon({
        className: 'marcador-origen',
        html: `<div style="
            background-color: #4CAF50; 
            border: 3px solid white; 
            border-radius: 50%; 
            width: 16px; 
            height: 16px; 
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.8), 0 0 0 4px rgba(76, 175, 80, 0.3);">
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
    
    // Icono para el punto final (pin rojo con sombra)
    const iconoFin = L.divIcon({
        className: 'marcador-fin',
        html: `<div style="
            width: 22px; 
            height: 22px;
            position: relative;">
            <div style="
                position: absolute;
                background-color: #e53935; 
                width: 22px; 
                height: 22px; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                top: 0;
                left: 0;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);">
            </div>
            <div style="
                position: absolute;
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
                top: 7px;
                left: 7px;
                transform: rotate(45deg);">
            </div>
        </div>`,
        iconSize: [22, 34],
        iconAnchor: [11, 34]
    });
    
    // Añadir marcadores al mapa (sin interacción para evitar conflictos)
    L.marker(inicio, {
        icon: iconoInicio,
        interactive: false,
        zIndexOffset: 1000
    }).addTo(rutaLayer);
    
    L.marker(fin, {
        icon: iconoFin,
        interactive: false,
        zIndexOffset: 1000
    }).addTo(rutaLayer);
}

/**
 * Agrega flechas de dirección a lo largo de la ruta
 * @param {Array} puntos - Array de puntos [lat, lng]
 * @param {string} color - Color base de las flechas
 */
function agregarFlechasDireccion(puntos, color) {
    // Determinar cuántas flechas añadir según longitud de la ruta
    const numFlechas = Math.min(5, Math.max(2, Math.floor(puntos.length / 10)));
    
    // Solo añadir flechas si hay suficientes puntos
    if (puntos.length < 10) return;
    
    // Colocar flechas a intervalos regulares a lo largo de la ruta
    for (let i = 1; i <= numFlechas; i++) {
        const idx = Math.floor((puntos.length - 1) * i / (numFlechas + 1));
        
        // Verificar que tengamos suficientes puntos antes y después
        if (idx < 3 || idx >= puntos.length - 3) continue;
        
        // Calcular el ángulo para la flecha usando puntos cercanos
        const p1 = puntos[idx - 3];
        const p2 = puntos[idx + 3];
        
        // Calcular ángulo de la dirección
        const dx = p2[1] - p1[1];
        const dy = p2[0] - p1[0];
        const angulo = Math.atan2(dx, dy) * 180 / Math.PI;
        
        // Crear icono de flecha elegante
        const iconoFlecha = L.divIcon({
            className: 'flecha-direccion',
            html: `<div style="
                transform: rotate(${angulo}deg);
                width: 12px;
                height: 12px;
                background-color: ${color};
                clip-path: polygon(0% 15%, 60% 15%, 60% 0%, 100% 50%, 60% 100%, 60% 85%, 0% 85%);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
            </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        // Añadir flecha al mapa (sin interacción)
        L.marker(puntos[idx], {
            icon: iconoFlecha,
            interactive: false
        }).addTo(rutaLayer);
    }
}

/**
 * Anima la aparición de la ruta
 * @param {L.Polyline} polyline - Línea de la ruta a animar
 */
function animarRuta(polyline) {
    // Establecer configuración inicial (invisible)
    polyline.setStyle({
        opacity: 0,
        weight: polyline.options.weight * 0.5
    });
    
    // Variables para la animación
    let progreso = 0;
    const duracion = 800; // milisegundos 
    const intervalo = 16; // aproximadamente 60fps
    const pasos = duracion / intervalo;
    const estiloOriginal = {
        opacity: polyline.options.opacity,
        weight: polyline.options.weight
    };
    
    // Función de animación
    const animar = () => {
        progreso += 1 / pasos;
        
        // Actualizar estilo según progreso
        polyline.setStyle({
            opacity: Math.min(1, progreso) * estiloOriginal.opacity,
            weight: (0.5 + Math.min(1, progreso) * 0.5) * estiloOriginal.weight
        });
        
        // Continuar animación o finalizar
        if (progreso < 1) {
            setTimeout(animar, intervalo);
        } else {
            // Restaurar estilo original
            polyline.setStyle(estiloOriginal);
        }
    };
    
    // Iniciar animación
    setTimeout(animar, 0);
}
/**
 * Agrega marcadores de origen y destino a la ruta
 * @param {Array} inicio - Punto de inicio [lat, lng]
 * @param {Array} fin - Punto de fin [lat, lng]
 */
function agregarMarcadoresRuta(inicio, fin) {
    // Icono para el punto de inicio (círculo verde con efecto)
    const iconoInicio = L.divIcon({
        className: 'marcador-origen',
        html: `<div style="
            background-color: #4CAF50; 
            border: 3px solid white; 
            border-radius: 50%; 
            width: 16px; 
            height: 16px; 
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.8), 0 0 0 4px rgba(76, 175, 80, 0.3);">
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
    
    // Icono para el punto final (pin rojo con sombra)
    const iconoFin = L.divIcon({
        className: 'marcador-fin',
        html: `<div style="
            width: 22px; 
            height: 22px;
            position: relative;">
            <div style="
                position: absolute;
                background-color: #e53935; 
                width: 22px; 
                height: 22px; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                top: 0;
                left: 0;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);">
            </div>
            <div style="
                position: absolute;
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
                top: 7px;
                left: 7px;
                transform: rotate(45deg);">
            </div>
        </div>`,
        iconSize: [22, 34],
        iconAnchor: [11, 34]
    });
    
    // Añadir marcadores al mapa (sin interacción para evitar conflictos)
    L.marker(inicio, {
        icon: iconoInicio,
        interactive: false,
        zIndexOffset: 1000
    }).addTo(rutaLayer);
    
    L.marker(fin, {
        icon: iconoFin,
        interactive: false,
        zIndexOffset: 1000
    }).addTo(rutaLayer);
}

/**
 * Agrega flechas de dirección a lo largo de la ruta
 * @param {Array} puntos - Array de puntos [lat, lng]
 * @param {string} color - Color base de las flechas
 */
function agregarFlechasDireccion(puntos, color) {
    // Determinar cuántas flechas añadir según longitud de la ruta
    const numFlechas = Math.min(5, Math.max(2, Math.floor(puntos.length / 10)));
    
    // Solo añadir flechas si hay suficientes puntos
    if (puntos.length < 10) return;
    
    // Colocar flechas a intervalos regulares a lo largo de la ruta
    for (let i = 1; i <= numFlechas; i++) {
        const idx = Math.floor((puntos.length - 1) * i / (numFlechas + 1));
        
        // Verificar que tengamos suficientes puntos antes y después
        if (idx < 3 || idx >= puntos.length - 3) continue;
        
        // Calcular el ángulo para la flecha usando puntos cercanos
        const p1 = puntos[idx - 3];
        const p2 = puntos[idx + 3];
        
        // Calcular ángulo de la dirección
        const dx = p2[1] - p1[1];
        const dy = p2[0] - p1[0];
        const angulo = Math.atan2(dx, dy) * 180 / Math.PI;
        
        // Crear icono de flecha elegante
        const iconoFlecha = L.divIcon({
            className: 'flecha-direccion',
            html: `<div style="
                transform: rotate(${angulo}deg);
                width: 12px;
                height: 12px;
                background-color: ${color};
                clip-path: polygon(0% 15%, 60% 15%, 60% 0%, 100% 50%, 60% 100%, 60% 85%, 0% 85%);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
            </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        // Añadir flecha al mapa (sin interacción)
        L.marker(puntos[idx], {
            icon: iconoFlecha,
            interactive: false
        }).addTo(rutaLayer);
    }
}

/**
 * Anima la aparición de la ruta
 * @param {L.Polyline} polyline - Línea de la ruta a animar
 */
function animarRuta(polyline) {
    // Establecer configuración inicial (invisible)
    polyline.setStyle({
        opacity: 0,
        weight: polyline.options.weight * 0.5
    });
    
    // Variables para la animación
    let progreso = 0;
    const duracion = 800; // milisegundos 
    const intervalo = 16; // aproximadamente 60fps
    const pasos = duracion / intervalo;
    const estiloOriginal = {
        opacity: polyline.options.opacity,
        weight: polyline.options.weight
    };
    
    // Función de animación
    const animar = () => {
        progreso += 1 / pasos;
        
        // Actualizar estilo según progreso
        polyline.setStyle({
            opacity: Math.min(1, progreso) * estiloOriginal.opacity,
            weight: (0.5 + Math.min(1, progreso) * 0.5) * estiloOriginal.weight
        });
        
        // Continuar animación o finalizar
        if (progreso < 1) {
            setTimeout(animar, intervalo);
        } else {
            // Restaurar estilo original
            polyline.setStyle(estiloOriginal);
        }
    };
    
    // Iniciar animación
    setTimeout(animar, 0);
}
/**
 * Aplica un algoritmo de suavizado avanzado usando curvas de Bézier
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @returns {Array} - Ruta suavizada
 */
function suavizarRutaBezier(ruta) {
    // Si hay menos de 3 puntos, devolver la ruta original
    if (ruta.length < 3) return ruta;
    
    // Array para almacenar la ruta suavizada
    rutaSuavizadaBezier = [];
    
    // Añadir el primer punto tal cual
    rutaSuavizadaBezier.push(ruta[0]);
    
    // Factor de suavizado - mayor número = más puntos interpolados
    const factorSuavizado = 8;
    
    // Factor de curvatura - controla cuánto se curva la línea (0.2 = curva suave)
    const factorCurvatura = 0.2;
    
    // Para cada segmento de la ruta (entre pares de puntos)
    for (let i = 0; i < ruta.length - 1; i++) {
        const p0 = ruta[i];         // Punto actual
        const p1 = ruta[i + 1];     // Siguiente punto
        
        // Determinar puntos de control para la curva de Bézier
        let puntoControl1, puntoControl2;
        
        if (i > 0 && i < ruta.length - 2) {
            // Punto anterior
            const pAnterior = ruta[i - 1];
            // Punto después del siguiente
            const pDespues = ruta[i + 2];
            
            // Calcular vectores de dirección
            const vectorAnterior = [p0[0] - pAnterior[0], p0[1] - pAnterior[1]];
            const vectorSiguiente = [p1[0] - p0[0], p1[1] - p0[1]];
            const vectorDespues = [pDespues[0] - p1[0], pDespues[1] - p1[1]];
            
            // Normalizar vectores
            const magAnterior = Math.sqrt(vectorAnterior[0]*vectorAnterior[0] + vectorAnterior[1]*vectorAnterior[1]);
            const magSiguiente = Math.sqrt(vectorSiguiente[0]*vectorSiguiente[0] + vectorSiguiente[1]*vectorSiguiente[1]);
            const magDespues = Math.sqrt(vectorDespues[0]*vectorDespues[0] + vectorDespues[1]*vectorDespues[1]);
            
            // Evitar divisiones por cero
            const vecAntNorm = magAnterior === 0 ? [0, 0] : [vectorAnterior[0]/magAnterior, vectorAnterior[1]/magAnterior];
            const vecSigNorm = magSiguiente === 0 ? [0, 0] : [vectorSiguiente[0]/magSiguiente, vectorSiguiente[1]/magSiguiente];
            const vecDesNorm = magDespues === 0 ? [0, 0] : [vectorDespues[0]/magDespues, vectorDespues[1]/magDespues];
            
            // Calcular puntos de control basados en los vectores de dirección
            puntoControl1 = [
                p0[0] + vecSigNorm[0] * magSiguiente * factorCurvatura,
                p0[1] + vecSigNorm[1] * magSiguiente * factorCurvatura
            ];
            
            puntoControl2 = [
                p1[0] - vecDesNorm[0] * magSiguiente * factorCurvatura,
                p1[1] - vecDesNorm[1] * magSiguiente * factorCurvatura
            ];
        } else {
            // Para los puntos extremos, usar un cálculo simplificado
            const dx = p1[0] - p0[0];
            const dy = p1[1] - p0[1];
            
            puntoControl1 = [
                p0[0] + dx * factorCurvatura,
                p0[1] + dy * factorCurvatura
            ];
            
            puntoControl2 = [
                p1[0] - dx * factorCurvatura,
                p1[1] - dy * factorCurvatura
            ];
        }
        
        // Generar puntos intermedios usando curva de Bézier cúbica
        for (let j = 1; j <= factorSuavizado; j++) {
            const t = j / factorSuavizado;
            const punto = calcularPuntoBezier(p0, puntoControl1, puntoControl2, p1, t);
            rutaSuavizadaBezier.push(punto);
        }
    }
    
    // Si no terminamos exactamente en el último punto original, añadirlo
    const ultimoPunto = ruta[ruta.length - 1];
    const ultimoSuavizado = rutaSuavizadaBezier[rutaSuavizadaBezier.length - 1];
    
    if (ultimoPunto[0] !== ultimoSuavizado[0] || ultimoPunto[1] !== ultimoSuavizado[1]) {
        rutaSuavizadaBezier.push(ultimoPunto);
    }
    
    return ruta;
}

/**
 * Calcula un punto en una curva de Bézier cúbica
 * @param {Array} p0 - Punto inicial [lat, lng]
 * @param {Array} p1 - Primer punto de control [lat, lng]
 * @param {Array} p2 - Segundo punto de control [lat, lng]
 * @param {Array} p3 - Punto final [lat, lng]
 * @param {number} t - Parámetro de la curva (0 a 1)
 * @returns {Array} - Punto interpolado [lat, lng]
 */
function calcularPuntoBezier(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    // Fórmula de Bézier cúbica:
    // B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
    const lat = mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
    const lng = mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];
    
    return [lat, lng];
}

/**
 * Añade flechas de dirección mejoradas a lo largo de la ruta
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @param {string} color - Color de las flechas
 */
function añadirFlechasDireccionMejoradas(ruta, color) {
    // Determinar cuántas flechas añadir basado en la longitud de la ruta
    const numSegmentos = ruta.length;
    const numFlechas = Math.min(8, Math.max(3, Math.floor(numSegmentos / 30)));
    
    // Colocar flechas a intervalos regulares pero evitando inicio y fin
    for (let i = 1; i <= numFlechas; i++) {
        const idx = Math.floor((ruta.length - 1) * i / (numFlechas + 1));
        
        if (idx > 5 && idx < ruta.length - 5) {
            // Obtener puntos antes y después para calcular la dirección
            const p1 = ruta[idx - 5];
            const p2 = ruta[idx + 5];
            
            // Calcular ángulo
            const dx = p2[1] - p1[1];
            const dy = p2[0] - p1[0];
            const angulo = Math.atan2(dx, dy) * 180 / Math.PI;
            
            // Crear marcador con flecha más elegante
            const iconoFlecha = L.divIcon({
                className: 'ruta-flecha-icon',
                html: `<div style="
                    transform: rotate(${angulo}deg); 
                    width: 16px; 
                    height: 16px; 
                    background-color: ${color}; 
                    clip-path: polygon(0% 15%, 60% 15%, 60% 0%, 100% 50%, 60% 100%, 60% 85%, 0% 85%);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            
            L.marker(ruta[idx], {
                icon: iconoFlecha,
                interactive: false,
                keyboard: false
            }).addTo(rutaLayer);
        }
    }
}

/**
 * Añade marcadores de inicio y fin mejorados a la ruta
 * @param {Array} inicio - Punto de inicio [lat, lng]
 * @param {Array} fin - Punto de fin [lat, lng]
 */
function añadirMarcadoresRutaAvanzados(inicio, fin) {
    // Icono de inicio (círculo pulsante)
    const iconoInicio = L.divIcon({
        className: 'ruta-inicio-icon',
        html: `<div style="
                position: relative;
                width: 24px;
                height: 24px;
             ">
                <div style="
                    position: absolute;
                    background-color: rgba(76, 175, 80, 0.3);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: pulse 2s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    background-color: #4CAF50;
                    border: 2px solid white; 
                    border-radius: 50%; 
                    width: 16px; 
                    height: 16px; 
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                ">
                    <div style="
                        width: 6px; 
                        height: 6px; 
                        background-color: white; 
                        border-radius: 50%; 
                        margin: 5px auto;
                    "></div>
                </div>
              </div>
              <style>
              @keyframes pulse {
                0% { transform: scale(0.8); opacity: 0.7; }
                70% { transform: scale(1.5); opacity: 0; }
                100% { transform: scale(0.8); opacity: 0; }
              }
              </style>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    // Icono de fin (pin con animación de rebote)
    const iconoFin = L.divIcon({
        className: 'ruta-fin-icon',
        html: `<div style="
                position: relative;
                width: 24px;
                height: 36px;
             ">
                <div style="
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    background-color: #e53935; 
                    border-radius: 50% 50% 50% 0; 
                    transform: rotate(-45deg); 
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    animation: bounce 1s infinite alternate;
                "></div>
                <div style="
                    position: absolute;
                    top: 7px;
                    left: 7px;
                    width: 10px;
                    height: 10px;
                    background-color: white;
                    border-radius: 50%;
                    transform: rotate(45deg);
                "></div>
              </div>
              <style>
              @keyframes bounce {
                0% { transform: rotate(-45deg) translateY(0); }
                100% { transform: rotate(-45deg) translateY(-5px); }
              }
              </style>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36]
    });
    
    // Añadir marcadores con títulos
    L.marker(inicio, {
        icon: iconoInicio,
        title: 'Punto de partida'
    }).addTo(rutaLayer).bindTooltip("Punto de partida", 
        {permanent: false, direction: 'top', offset: [0, -15]});
    
    L.marker(fin, {
        icon: iconoFin,
        title: 'Destino'
    }).addTo(rutaLayer).bindTooltip("Destino", 
        {permanent: false, direction: 'top', offset: [0, -30]});
}

/**
 * Resalta los puntos de giro importantes en la ruta
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @param {string} colorBase - Color base de la ruta
 */
function resaltarPuntosGiro(ruta, colorBase) {
    // Umbral para considerar un cambio de dirección significativo (en grados)
    const umbralCambioGrados = 30;
    
    // Array para almacenar los puntos de giro
    const puntosGiro = [];
    
    // Detectar cambios significativos de dirección
    // Necesitamos al menos 3 puntos consecutivos para calcular ángulos
    if (ruta.length > 20) {
        // Saltar algunos puntos para no evaluar cada pequeño cambio
        const paso = Math.max(5, Math.floor(ruta.length / 50));
        
        for (let i = paso; i < ruta.length - paso; i += paso) {
            // Calcular vectores entre puntos
            const puntoAnterior = ruta[i - paso];
            const puntoActual = ruta[i];
            const puntoSiguiente = ruta[i + paso];
            
            // Vectores de los segmentos
            const vector1 = [
                puntoActual[0] - puntoAnterior[0],
                puntoActual[1] - puntoAnterior[1]
            ];
            
            const vector2 = [
                puntoSiguiente[0] - puntoActual[0],
                puntoSiguiente[1] - puntoActual[1]
            ];
            
            // Calcular el ángulo entre los vectores usando el producto punto
            const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
            const mag1 = Math.sqrt(vector1[0] * vector1[0] + vector1[1] * vector1[1]);
            const mag2 = Math.sqrt(vector2[0] * vector2[0] + vector2[1] * vector2[1]);
            
            // Evitar divisiones por cero
            if (mag1 === 0 || mag2 === 0) continue;
            
            // Calcular el coseno del ángulo y convertir a grados
            const cosTheta = Math.min(1, Math.max(-1, dotProduct / (mag1 * mag2)));
            const angulo = Math.acos(cosTheta) * 180 / Math.PI;
            
            // Si el ángulo es mayor que el umbral, considerar como punto de giro
            if (angulo > umbralCambioGrados) {
                puntosGiro.push({
                    punto: puntoActual,
                    angulo: angulo
                });
            }
        }
    }
    
    // Limitar a los puntos de giro más significativos si hay demasiados
    puntosGiro.sort((a, b) => b.angulo - a.angulo); // Ordenar por ángulo (mayor primero)
    const puntosAMostrar = puntosGiro.slice(0, 5); // Mostrar solo los 5 giros más importantes
    
    // Añadir puntos de giro al mapa
    puntosAMostrar.forEach(item => {
        // Normalizar ángulo para determinar tamaño del punto (giros más bruscos = puntos más grandes)
        const tamañoNormalizado = Math.min(8, Math.max(4, (item.angulo / 180) * 8 + 2));
        
        // Color más oscuro que el de la ruta
        const colorMásOscuro = oscurecerColor(colorBase, 0.3);
        
        // Círculo para marcar la intersección
        L.circleMarker(item.punto, {
            radius: tamañoNormalizado,
            color: '#fff',
            weight: 2,
            fillColor: colorMásOscuro,
            fillOpacity: 0.8,
            opacity: 1
        }).addTo(rutaLayer);
    });
}

/**
 * Anima la ruta para un efecto visual atractivo
 * @param {L.Polyline} polyline - La polilínea a animar
 */
function animarRuta(polyline) {
    // Guardar los estilos originales
    const estiloOriginal = {
        weight: polyline.options.weight,
        opacity: polyline.options.opacity
    };
    
    // Función para animar la entrada de la ruta
    let contador = 0;
    const maxPasos = 100;
    const intervalo = 10; // ms entre pasos de animación
    
    // Iniciar invisible
    polyline.setStyle({
        opacity: 0,
        weight: estiloOriginal.weight * 0.5
    });
    
    const animacion = setInterval(() => {
        contador++;
        
        // Calcular progreso de la animación (0 a 1)
        const progreso = contador / maxPasos;
        
        // Animar la ruta
        polyline.setStyle({
            opacity: progreso * estiloOriginal.opacity,
            weight: (0.5 + progreso * 0.5) * estiloOriginal.weight
        });
        
        // Detener cuando se complete
        if (contador >= maxPasos) {
            clearInterval(animacion);
            // Restaurar estilo original
            polyline.setStyle(estiloOriginal);
        }
    }, intervalo);
}

/**
 * Oscurece un color hexadecimal
 * @param {string} color - Color en formato hex (#RRGGBB)
 * @param {number} factor - Factor de oscurecimiento (0-1)
 * @returns {string} - Color oscurecido en formato hex
 */
function oscurecerColor(color, factor) {
    // Eliminar el # si existe
    color = color.replace('#', '');
    
    // Convertir a RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);
    
    // Oscurecer
    r = Math.floor(r * (1 - factor));
    g = Math.floor(g * (1 - factor));
    b = Math.floor(b * (1 - factor));
    
    // Asegurar que los valores estén en el rango correcto
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    
    // Convertir de nuevo a hex
    return '#' + 
        r.toString(16).padStart(2, '0') + 
        g.toString(16).padStart(2, '0') + 
        b.toString(16).padStart(2, '0');
}

/**
 * Aplica un algoritmo de suavizado a la ruta para evitar ángulos agudos
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @param {number} factorSuavizado - Cantidad de puntos a generar entre cada par de puntos
 * @returns {Array} - Ruta suavizada
 */
function suavizarRuta(ruta, factorSuavizado = 3) {
    // Si la ruta tiene menos de 3 puntos, no podemos suavizarla adecuadamente
    if (ruta.length < 3) return ruta;
    
    // Resultado final
    const rutaSuavizada = [];
    
    // Añadir el primer punto tal cual
    rutaSuavizada.push(ruta[0]);
    
    // Para cada segmento de la ruta (entre dos puntos)
    for (let i = 0; i < ruta.length - 2; i++) {
        const p0 = i > 0 ? ruta[i - 1] : ruta[i];     // Punto anterior o actual si estamos en el primero
        const p1 = ruta[i];                           // Punto actual
        const p2 = ruta[i + 1];                       // Siguiente punto
        const p3 = i < ruta.length - 2 ? ruta[i + 2] : ruta[i + 1]; // Punto después del siguiente o último si estamos al final
        
        // Generar puntos intermedios usando una curva de Catmull-Rom
        for (let j = 1; j <= factorSuavizado; j++) {
            const t = j / factorSuavizado;
            const punto = calcularPuntoCurva(p0, p1, p2, p3, t);
            rutaSuavizada.push(punto);
        }
    }
    
    // Añadir los últimos dos puntos
    rutaSuavizada.push(ruta[ruta.length - 2]);
    rutaSuavizada.push(ruta[ruta.length - 1]);
    
    return rutaSuavizada;
}

/**
 * Calcula un punto en una curva de Catmull-Rom
 * @param {Array} p0 - Primer punto de control [lat, lng]
 * @param {Array} p1 - Segundo punto de control [lat, lng]
 * @param {Array} p2 - Tercer punto de control [lat, lng]
 * @param {Array} p3 - Cuarto punto de control [lat, lng]
 * @param {number} t - Parámetro de la curva (0 a 1)
 * @returns {Array} - Punto interpolado [lat, lng]
 */
function calcularPuntoCurva(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    // Coeficientes Catmull-Rom
    const c0 = -0.5 * t3 + t2 - 0.5 * t;
    const c1 = 1.5 * t3 - 2.5 * t2 + 1;
    const c2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
    const c3 = 0.5 * t3 - 0.5 * t2;
    
    // Calcular coordenadas usando los coeficientes
    const lat = c0 * p0[0] + c1 * p1[0] + c2 * p2[0] + c3 * p3[0];
    const lng = c0 * p0[1] + c1 * p1[1] + c2 * p2[1] + c3 * p3[1];
    
    return [lat, lng];
}

/**
 * Añade flechas de dirección a lo largo de la ruta
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @param {string} color - Color de las flechas
 */
function añadirFlechasDireccion(ruta, color) {
    // Determinar cuántas flechas añadir basado en la longitud de la ruta
    const numFlechas = Math.min(5, Math.max(2, Math.floor(ruta.length / 10)));
    
    // Colocar flechas a intervalos regulares
    for (let i = 1; i <= numFlechas; i++) {
        const idx = Math.floor((ruta.length - 1) * i / (numFlechas + 1));
        if (idx > 0 && idx < ruta.length - 1) {
            const p1 = ruta[idx - 1];
            const p2 = ruta[idx + 1];
            
            // Calcular ángulo
            const dx = p2[1] - p1[1];
            const dy = p2[0] - p1[0];
            const angulo = Math.atan2(dx, dy) * 180 / Math.PI;
            
            // Crear marcador con flecha
            const iconoFlecha = L.divIcon({
                className: 'ruta-flecha-icon',
                html: `<div style="transform: rotate(${angulo}deg); 
                              width: 12px; 
                              height: 12px; 
                              background-color: ${color}; 
                              clip-path: polygon(0% 0%, 100% 50%, 0% 100%);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            
            L.marker(ruta[idx], {
                icon: iconoFlecha,
                interactive: false,
                keyboard: false
            }).addTo(rutaLayer);
        }
    }
}

/**
 * Añade marcadores de inicio y fin a la ruta
 * @param {Array} inicio - Punto de inicio [lat, lng]
 * @param {Array} fin - Punto de fin [lat, lng]
 */
function añadirMarcadoresRuta(inicio, fin) {
    // Icono de inicio (círculo verde)
    const iconoInicio = L.divIcon({
        className: 'ruta-inicio-icon',
        html: `<div style="background-color: #4CAF50; 
                     border: 2px solid white; 
                     border-radius: 50%; 
                     width: 16px; 
                     height: 16px; 
                     box-shadow: 0 0 5px rgba(0,0,0,0.3);">
                <div style="width: 6px; 
                          height: 6px; 
                          background-color: white; 
                          border-radius: 50%; 
                          margin: 5px;">
                </div>
              </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Icono de fin (bandera o pin rojo)
    const iconoFin = L.divIcon({
        className: 'ruta-fin-icon',
        html: `<div style="background-color: #e53935; 
                     width: 20px; 
                     height: 20px; 
                     border-radius: 50% 50% 50% 0; 
                     transform: rotate(-45deg); 
                     border: 2px solid white;
                     box-shadow: 0 0 5px rgba(0,0,0,0.3);">
              </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20]
    });
    
    // Añadir marcadores
    L.marker(inicio, {
        icon: iconoInicio,
        title: 'Inicio'
    }).addTo(rutaLayer);
    
    L.marker(fin, {
        icon: iconoFin,
        title: 'Destino'
    }).addTo(rutaLayer);
}

/**
 * Resalta las intersecciones importantes en la ruta
 * @param {Array} ruta - Array de puntos [lat, lng]
 * @param {string} colorBase - Color base de la ruta
 */
function resaltarInterseccionesImportantes(ruta, colorBase) {
    // Identificar puntos donde hay cambios significativos de dirección
    // (simplificado - en una implementación real verificaríamos datos reales de intersecciones)
    
    const intersecciones = [];
    
    // Detectar cambios significativos de dirección
    if (ruta.length > 5) {
        for (let i = 2; i < ruta.length - 2; i += Math.floor(ruta.length / 8)) {
            // Verificar que sea un punto donde hay un cambio de dirección
            // Para una implementación más robusta, calcularíamos el ángulo real
            intersecciones.push(ruta[i]);
        }
    }
    
    // Añadir puntos de intersección al mapa
    intersecciones.forEach(punto => {
        // Círculo para marcar la intersección
        L.circleMarker(punto, {
            radius: 4,
            color: '#fff',
            weight: 2,
            fillColor: colorBase,
            fillOpacity: 1,
            opacity: 0.8
        }).addTo(rutaLayer);
    });
}

/**
 * Carga y muestra puntos de seguridad en la ruta
 * @param {Array} puntos - Array de objetos con información de puntos de seguridad
 */
function mostrarPuntosSeguridadEnRuta(puntos) {
    // Limpiar puntos existentes
    securityPointsLayer.clearLayers();

    // Añadir los nuevos puntos
    puntos.forEach(punto => {
        // Definir el icono según el tipo de punto
        let icono;
        switch (punto.tipo) {
            case 'comisaria':
                icono = L.divIcon({
                    html: '<i class="fas fa-shield-alt" style="color:#1a73e8;font-size:24px;"></i>',
                    className: 'marker-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                break;
            case 'serenazgo':
                icono = L.divIcon({
                    html: '<i class="fas fa-user-shield" style="color:#4CAF50;font-size:24px;"></i>',
                    className: 'marker-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                break;
            case 'hospital':
                icono = L.divIcon({
                    html: '<i class="fas fa-hospital" style="color:#e53935;font-size:24px;"></i>',
                    className: 'marker-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                break;
            case 'incidente':
                icono = L.divIcon({
                    html: '<i class="fas fa-exclamation-triangle" style="color:#ff9800;font-size:24px;"></i>',
                    className: 'marker-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                break;
            default:
                icono = L.divIcon({
                    html: '<i class="fas fa-info-circle" style="color:#9c27b0;font-size:24px;"></i>',
                    className: 'marker-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
        }

        // Crear marcador con el icono correspondiente
        const marcador = L.marker([punto.lat, punto.lng], { icon: icono });
        
        // Añadir popup con información
        marcador.bindPopup(`
            <strong>${punto.nombre}</strong><br>
            ${punto.descripcion || ''}<br>
            <small>Distancia a la ruta: ${punto.distancia} metros</small>
        `);
        
        // Añadir al layer group
        marcador.addTo(securityPointsLayer);
    });

    // Actualizar la lista en el panel de información
    actualizarListaPuntosSeguridadUI(puntos);
}

/**
 * Actualiza la lista de puntos de seguridad en la interfaz de usuario
 * @param {Array} puntos - Array de objetos con información de puntos de seguridad
 */
function actualizarListaPuntosSeguridadUI(puntos) {
    const listaElemento = document.getElementById('security-landmarks');
    listaElemento.innerHTML = '';

    // Ordenar puntos por distancia
    puntos.sort((a, b) => a.distancia - b.distancia);

    // Añadir los 5 puntos más cercanos
    puntos.slice(0, 5).forEach(punto => {
        const elemento = document.createElement('li');
        
        // Añadir icono según tipo
        let iconoClass;
        switch (punto.tipo) {
            case 'comisaria': iconoClass = 'fa-shield-alt'; break;
            case 'serenazgo': iconoClass = 'fa-user-shield'; break;
            case 'hospital': iconoClass = 'fa-hospital'; break;
            case 'incidente': iconoClass = 'fa-exclamation-triangle'; break;
            default: iconoClass = 'fa-info-circle';
        }
        
        elemento.innerHTML = `<i class="fas ${iconoClass}"></i> ${punto.nombre} <small>(${punto.distancia}m)</small>`;
        listaElemento.appendChild(elemento);
    });
}

/**
 * Carga los puntos de seguridad iniciales desde el servidor
 */
function cargarPuntosSeguridadIniciales() {
    // Esta función cargaría los puntos de seguridad desde el backend
    // Para el prototipo, usaremos datos ficticios
    fetch(`${API_BASE_URL}/api/puntos-seguridad`)
        .then(response => response.json())
        .then(data => {
            // Actualizar el mapa con los puntos
            mostrarPuntosSeguridadEnRuta(data);
        })
        .catch(error => {
            console.error('Error al cargar los puntos de seguridad:', error);
        });
}

/**
 * Abre el modal para reportar un incidente en una ubicación específica
 * @param {L.LatLng} latlng - Coordenadas donde ocurrió el incidente
 */
function abrirModalReporte(latlng) {
    // Guardar las coordenadas para usar al enviar el formulario
    window.incidenteLatLng = latlng;
    
    // Mostrar el modal
    const modal = document.getElementById('report-incident');
    modal.classList.remove('hidden');
    
    // Establecer la fecha y hora actual en el formulario
    const fechaInput = document.getElementById('incident-date');
    const ahora = new Date();
    // Formatear fecha y hora para el input datetime-local
    const fechaFormateada = ahora.toISOString().slice(0, 16);
    fechaInput.value = fechaFormateada;
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación (success, error, warning)
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos inline para la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.padding = '15px 20px';
    notificacion.style.borderRadius = '4px';
    notificacion.style.zIndex = '9999';
    notificacion.style.maxWidth = '300px';
    notificacion.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    
    // Establecer color según tipo
    if (tipo === 'success') {
        notificacion.style.backgroundColor = '#4CAF50';
        notificacion.style.color = 'white';
    } else if (tipo === 'error') {
        notificacion.style.backgroundColor = '#f44336';
        notificacion.style.color = 'white';
    } else if (tipo === 'warning') {
        notificacion.style.backgroundColor = '#ff9800';
        notificacion.style.color = 'white';
    } else {
        notificacion.style.backgroundColor = '#2196F3';
        notificacion.style.color = 'white';
    }
    
    // Añadir al DOM
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 500);
    }, 3000);
}

// Inicializar el mapa cuando la ventana cargue
window.addEventListener('load', inicializarMapa);