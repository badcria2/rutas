/**
 * favorites.js
 * Gestiona la funcionalidad de rutas favoritas mediante API
 */

// Array para almacenar las rutas favoritas
let rutasFavoritas = [];

// Elementos del DOM
const btnSaveRoute = document.getElementById('save-route');
const btnFavoritesDropdown = document.getElementById('favorites-dropdown');
const favoritesList = document.getElementById('favorites-list');

// Inicializar funcionalidad de favoritos
function inicializarFavoritos() {
    // Cargar favoritos desde la API
    cargarFavoritosDesdeAPI();
    
    // Evento para guardar ruta actual
    btnSaveRoute.addEventListener('click', guardarRutaActual);
    
    // Evento para mostrar/ocultar dropdown
    btnFavoritesDropdown.addEventListener('click', toggleFavoritesDropdown);
    
    // Evento para cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown') && !favoritesList.classList.contains('hidden')) {
            favoritesList.classList.add('hidden');
        }
    });
    
    // Por defecto, el botón de guardar ruta está deshabilitado
    actualizarEstadoBotonGuardar();
}

// Cargar favoritos desde la API
function cargarFavoritosDesdeAPI() {
    // Mostrar indicador de carga
    favoritesList.innerHTML = '<div class="loading-favorites">Cargando rutas guardadas...</div>';
    
    // Realizar petición a la API
    fetch(`${API_BASE_URL}/api/ruta-favorita`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar rutas favoritas: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            rutasFavoritas = data;
            actualizarListaFavoritos();
        })
        .catch(error => {
            console.error("Error cargando favoritos:", error);
            favoritesList.innerHTML = '<div class="error-favorites">Error al cargar rutas. Intente nuevamente.</div>';
            
            // Mostrar notificación de error
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('No se pudieron cargar las rutas favoritas', 'error');
            }
        });
}

// Actualizar el estado del botón de guardar ruta
function actualizarEstadoBotonGuardar() {
    // Solo habilitar si hay origen y destino seleccionados
    if (marcadorOrigen && marcadorDestino) {
        btnSaveRoute.classList.remove('disabled');
        btnSaveRoute.disabled = false;
    } else {
        btnSaveRoute.classList.add('disabled');
        btnSaveRoute.disabled = true;
    }
}

// Guardar la ruta actual como favorita en la API
function guardarRutaActual() {
    // Verificar que haya una ruta calculada
    if (!marcadorOrigen || !marcadorDestino || btnSaveRoute.disabled) {
        mostrarNotificacion('Primero debes calcular una ruta', 'warning');
        return;
    }
    
    // Obtener datos de la ruta actual
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    
    // Solicitar nombre para la ruta
    const nombreRuta = prompt('Nombre para esta ruta:', `${origen} → ${destino}`);
    
    // Si cancela, no guardar
    if (nombreRuta === null) return;
    
    // Cambiar estado del botón mientras se guarda
    btnSaveRoute.disabled = true;
    btnSaveRoute.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    // Datos de la ruta a guardar
    const nuevaRuta = {
        nombre: nombreRuta || `${origen} → ${destino}`,
        origen: {
            nombre: origen,
            coordenadas: {
                lat: marcadorOrigen.getLatLng().lat,
                lng: marcadorOrigen.getLatLng().lng
            }
        },
        destino: {
            nombre: destino,
            coordenadas: {
                lat: marcadorDestino.getLatLng().lat,
                lng: marcadorDestino.getLatLng().lng
            }
        },
        modoTransporte: modoTransporteActual,
        fechaCreacion: new Date().toISOString()
    };
    
    // Enviar a la API
    fetch(`${API_BASE_URL}/api/ruta-favorita`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevaRuta)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error al guardar ruta: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Recargar la lista de favoritos
        cargarFavoritosDesdeAPI();
        
        // Mostrar confirmación
        mostrarNotificacion('Ruta guardada en favoritos', 'success');
    })
    .catch(error => {
        console.error("Error guardando ruta:", error);
        mostrarNotificacion('No se pudo guardar la ruta. Intente nuevamente.', 'error');
    })
    .finally(() => {
        // Restaurar estado del botón
        btnSaveRoute.disabled = false;
        btnSaveRoute.innerHTML = '<i class="fas fa-heart"></i> Guardar Ruta';
        actualizarEstadoBotonGuardar();
    });
}

// Actualizar la lista visual de favoritos
function actualizarListaFavoritos() {
    // Limpiar lista
    favoritesList.innerHTML = '';
    
    // Si no hay favoritos, mostrar mensaje
    if (!rutasFavoritas || rutasFavoritas.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-favorites';
        emptyMessage.textContent = 'No hay rutas guardadas';
        favoritesList.appendChild(emptyMessage);
        return;
    }
    
    // Añadir cada ruta a la lista
    rutasFavoritas.forEach(ruta => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        // Formatear fecha si existe
        let fechaFormateada = '';
        if (ruta.fechaCreacion) {
            try {
                const fecha = new Date(ruta.fechaCreacion);
                fechaFormateada = fecha.toLocaleDateString();
            } catch (e) {
                fechaFormateada = '';
            }
        }
        
        // Contenido del ítem
        item.innerHTML = `
            <div class="route-info">
                <div class="route-name" title="${ruta.nombre}">${ruta.nombre}</div>
                ${fechaFormateada ? `<div class="route-date">${fechaFormateada}</div>` : ''}
            </div>
            <div class="actions">
                <button class="load-route" title="Cargar esta ruta">
                    <i class="fas fa-route"></i>
                </button>
                <button class="delete-route" title="Eliminar de favoritos">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Evento para cargar la ruta
        item.querySelector('.load-route').addEventListener('click', () => {
            cargarRutaFavorita(ruta);
            favoritesList.classList.add('hidden');
        });
        
        // Evento para eliminar la ruta
        item.querySelector('.delete-route').addEventListener('click', () => {
            eliminarRutaFavorita(ruta.id);
        });
        
        favoritesList.appendChild(item);
    });
}

// Cargar una ruta favorita en el mapa
function cargarRutaFavorita(ruta) {
    // Mostrar indicador de carga
    mostrarNotificacion('Cargando ruta...', 'info');
    
    // Limpiar marcadores existentes
    if (marcadorOrigen) map.removeLayer(marcadorOrigen);
    if (marcadorDestino) map.removeLayer(marcadorDestino);
    
    // Crear marcador de origen
    marcadorOrigen = L.marker([ruta.origen.coordenadas.lat, ruta.origen.coordenadas.lng], {
        draggable: true,
        title: 'Origen: ' + ruta.origen.nombre
    }).addTo(map);
    
    // Crear marcador de destino
    marcadorDestino = L.marker([ruta.destino.coordenadas.lat, ruta.destino.coordenadas.lng], {
        draggable: true,
        title: 'Destino: ' + ruta.destino.nombre
    }).addTo(map);
    
    // Actualizar campos de texto
    document.getElementById('origen').value = ruta.origen.nombre;
    document.getElementById('destino').value = ruta.destino.nombre;
    
    // Ajustar modo de transporte si es diferente
    if (ruta.modoTransporte && ruta.modoTransporte !== modoTransporteActual) {
        // Encontrar y activar el botón correspondiente
        const botonesTransporte = document.querySelectorAll('.modo-transporte');
        botonesTransporte.forEach(boton => {
            if (boton.getAttribute('data-modo') === ruta.modoTransporte) {
                // Quitar clase activo de todos
                botonesTransporte.forEach(b => b.classList.remove('activo'));
                // Añadir clase activo al seleccionado
                boton.classList.add('activo');
                // Actualizar modo actual
                modoTransporteActual = ruta.modoTransporte;
            }
        });
    }
    
    // Ajustar vista para mostrar ambos puntos
    ajustarVistaMapa();
    
    // Calcular la ruta
    obtenerRutaVisual();
}

// Eliminar una ruta favorita mediante API
function eliminarRutaFavorita(id) {
    // Confirmar eliminación
    if (confirm('¿Estás seguro de eliminar esta ruta de tus favoritos?')) {
        // Mostrar indicador de carga en el ítem
        const item = favoritesList.querySelector(`.dropdown-item[data-id="${id}"]`);
        if (item) {
            item.classList.add('deleting');
            item.innerHTML = '<div class="loading-delete">Eliminando...</div>';
        }
        
        // Enviar solicitud a la API
        fetch(`${API_BASE_URL}/api/ruta-favorita/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al eliminar ruta: ${response.status}`);
            }
            
            // Recargar favoritos
            cargarFavoritosDesdeAPI();
            
            // Mostrar notificación
            mostrarNotificacion('Ruta eliminada de favoritos', 'success');
        })
        .catch(error => {
            console.error("Error eliminando ruta:", error);
            mostrarNotificacion('No se pudo eliminar la ruta. Intente nuevamente.', 'error');
            
            // Recargar para restaurar la vista
            cargarFavoritosDesdeAPI();
        });
    }
}

// Mostrar/ocultar dropdown de favoritos
function toggleFavoritesDropdown() {
    // Si está oculto y se va a mostrar, recargar favoritos
    if (favoritesList.classList.contains('hidden')) {
        cargarFavoritosDesdeAPI();
    }
    
    favoritesList.classList.toggle('hidden');
}

// Añadir a inicialización cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar favoritos después de cargar la página
    inicializarFavoritos();
});

// Eventos para actualizar estado del botón de guardar
// cuando se añaden/eliminan marcadores
function actualizarEstadoGuardarFavoritosAlCambiarMarcadores() {
    // Crear un intervalo para verificar el estado periódicamente
    // (más confiable que los observadores en este caso)
    setInterval(() => {
        actualizarEstadoBotonGuardar();
    }, 1000);
}

// Iniciar verificación periódica de marcadores al cargar el mapa
window.addEventListener('load', function() {
    // Dar tiempo a que el mapa se inicialice
    setTimeout(actualizarEstadoGuardarFavoritosAlCambiarMarcadores, 1000);
});