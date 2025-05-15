/**
 * app.js
 * Controla la lógica principal de la aplicación y la interacción con el API
 */

// Modo de transporte actual (valor por defecto: auto)
let modoTransporteActual = 'driving-car';
const API_BASE_URL = 'https://rutas-rywi.onrender.com';

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
 * Esta función reemplaza o complementa buscarRutaSegura() en app.js
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
            if (rutaData.ruta.caracteristicas && rutaData.ruta.caracteristicas.length > 0) {
                const coordenadasRuta = rutaData.ruta.caracteristicas[0].geometria.coordenadas;

                // Convertir formato [lng, lat] a [lat, lng] para Leaflet
                const puntos = coordenadasRuta.map(coord => [coord[1], coord[0]]);

                // Mostrar la ruta en el mapa
                mostrarRuta(puntos, '#3388ff');

                // Si tenemos límites (bounds), ajustar la vista
                if (rutaData.ruta.bounds) {
                    const bounds = [
                        [rutaData.ruta.bounds[1], rutaData.ruta.bounds[0]], // [lat, lng] Suroeste
                        [rutaData.ruta.bounds[3], rutaData.ruta.bounds[2]]  // [lat, lng] Noreste
                    ];
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
                // Mostrar puntos de seguridad cercanos a la ruta
                mostrarPuntosSeguridadEnRuta(rutaData.puntosSeguridad);

                // Actualizar la información de la ruta
                actualizarInformacionRuta(rutaData.ruta);

                // Mostrar el panel de información
                document.getElementById('route-info').classList.remove('hidden');

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
    const distanciaKm = (rutaData.propiedades.distancia).toFixed(1);

    // Formatear el tiempo (convertir de segundos a minutos)
    const tiempoMinutos = Math.round(rutaData.propiedades.duracion / 60);

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