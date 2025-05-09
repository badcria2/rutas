/**
 * Carga los incidentes desde el API
 * Esta función debe llamarse al cargar el mapa
 */
function cargarIncidentes() {
    // Obtener los incidentes cercanos al centro del mapa
    const centro = map.getCenter();
    
    // Parámetros: latitud, longitud y radio de búsqueda en metros (5000m = 5km)
    const params = new URLSearchParams({
        lat: centro.lat,
        lng: centro.lng,
        radio: 5000
    });
    
    fetch(`${API_BASE_URL}/api/incidentes?${params}`)
        .then(response => response.json())
        .then(incidentes => {
            console.log('Incidentes cargados:', incidentes);
            mostrarIncidentesEnMapa(incidentes);
        })
        .catch(error => {
            console.error('Error al cargar incidentes:', error);
            mostrarNotificacion('No se pudieron cargar los incidentes', 'error');
        });
}

/**
 * Layer para almacenar los marcadores de incidentes
 */
let incidentesLayer = null;

/**
 * Muestra los incidentes en el mapa
 * @param {Array} incidentes - Lista de incidentes devueltos por la API
 */
function mostrarIncidentesEnMapa(incidentes) {
    // Si ya existe la capa de incidentes, limpiarla
    if (incidentesLayer) {
        map.removeLayer(incidentesLayer);
    }
    
    // Crear nueva capa para incidentes
    incidentesLayer = L.layerGroup().addTo(map);
    
    // Añadir cada incidente al mapa
    incidentes.forEach(incidente => {
        // Determinar el icono según el tipo de incidente
        let iconoHtml, colorIcono;
        
        switch (incidente.tipo.toLowerCase()) {
            case 'robo':
                iconoHtml = 'fa-mask';
                colorIcono = '#e53935'; // Rojo
                break;
            case 'acoso':
                iconoHtml = 'fa-exclamation-circle';
                colorIcono = '#ff9800'; // Naranja
                break;
            case 'iluminacion':
                iconoHtml = 'fa-lightbulb';
                colorIcono = '#fdd835'; // Amarillo
                break;
            case 'transito':
                iconoHtml = 'fa-car-crash';
                colorIcono = '#f44336'; // Rojo
                break;
            case 'otro':
            default:
                iconoHtml = 'fa-exclamation-triangle';
                colorIcono = '#9c27b0'; // Púrpura
        }
        
        // Crear icono personalizado
        const icono = L.divIcon({
            html: `<i class="fas ${iconoHtml}" style="color:${colorIcono};font-size:18px;background:white;padding:6px;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></i>`,
            className: 'incidente-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        // Crear marcador
        const marcador = L.marker([incidente.lat, incidente.lng], { 
            icon: icono,
            title: `Incidente: ${incidente.tipo}`
        });
        
        // Formatear fecha para mostrar
        const fecha = new Date(incidente.fecha);
        const fechaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
        
        // Añadir popup con detalles
        marcador.bindPopup(`
            <div class="incidente-popup">
                <h3>${incidente.tipo.toUpperCase()}</h3>
                <p>${incidente.descripcion}</p>
                <small>Reportado: ${fechaFormateada}</small>
            </div>
        `);
        
        // Añadir a la capa de incidentes
        marcador.addTo(incidentesLayer);
    });
    
    // Actualizar la lista de incidentes en la interfaz
    actualizarListaIncidentesUI(incidentes);
}

/**
 * Actualiza la interfaz con la lista de incidentes
 * @param {Array} incidentes - Lista de incidentes
 */
function actualizarListaIncidentesUI(incidentes) {
    // Verificar si existe el contenedor de incidentes
    let listaElemento = document.getElementById('incidents-list');
    
    // Si no existe, crear el panel de incidentes
    if (!listaElemento) {
        crearPanelIncidentes();
        listaElemento = document.getElementById('incidents-list');
    }
    
    // Limpiar lista actual
    listaElemento.innerHTML = '';
    
    // Si no hay incidentes, mostrarlo
    if (incidentes.length === 0) {
        listaElemento.innerHTML = '<li class="no-incidents">No hay incidentes reportados en esta área</li>';
        return;
    }
    
    // Ordenar incidentes por fecha (más recientes primero)
    incidentes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Añadir los 5 incidentes más recientes
    incidentes.slice(0, 5).forEach(incidente => {
        const elemento = document.createElement('li');
        elemento.classList.add('incident-item');
        
        // Determinar icono según tipo
        let iconoClass;
        switch (incidente.tipo.toLowerCase()) {
            case 'robo': iconoClass = 'fa-mask'; break;
            case 'acoso': iconoClass = 'fa-exclamation-circle'; break;
            case 'iluminacion': iconoClass = 'fa-lightbulb'; break;
            case 'transito': iconoClass = 'fa-car-crash'; break;
            default: iconoClass = 'fa-exclamation-triangle';
        }
        
        // Formatear fecha
        const fecha = new Date(incidente.fecha);
        const fechaFormateada = fecha.toLocaleDateString();
        
        // Crear contenido HTML del elemento
        elemento.innerHTML = `
            <i class="fas ${iconoClass}"></i>
            <div class="incident-info">
                <span class="incident-type">${incidente.tipo}</span>
                <span class="incident-desc">${incidente.descripcion}</span>
                <span class="incident-date">${fechaFormateada}</span>
            </div>
        `;
        
        // Al hacer clic en un incidente de la lista, centrar el mapa en él
        elemento.addEventListener('click', () => {
            map.setView([incidente.lat, incidente.lng], 16);
            
            // Buscar y abrir el popup del marcador correspondiente
            incidentesLayer.eachLayer(layer => {
                const latlng = layer.getLatLng();
                if (latlng.lat === incidente.lat && latlng.lng === incidente.lng) {
                    layer.openPopup();
                }
            });
        });
        
        listaElemento.appendChild(elemento);
    });
}

/**
 * Crea el panel para mostrar la lista de incidentes
 */
function crearPanelIncidentes() {
    // Verificar si ya existe el panel de incidentes
    if (document.getElementById('incidents-panel')) {
        return;
    }
    
    // Crear el contenedor principal
    const panelIncidentes = document.createElement('div');
    panelIncidentes.id = 'incidents-panel';
    panelIncidentes.className = 'panel';
    panelIncidentes.style.position = 'absolute';
    panelIncidentes.style.bottom = '20px';
    panelIncidentes.style.left = '20px';
    panelIncidentes.style.width = '300px';
    panelIncidentes.style.backgroundColor = 'white';
    panelIncidentes.style.borderRadius = '8px';
    panelIncidentes.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    panelIncidentes.style.zIndex = '800';
    panelIncidentes.style.overflow = 'hidden';
    
    // Crear encabezado
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.style.backgroundColor = '#f44336';
    header.style.color = 'white';
    header.style.padding = '10px 15px';
    header.style.fontWeight = 'bold';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = '<span><i class="fas fa-exclamation-triangle"></i> Incidentes recientes</span>';
    
    // Botón para cerrar/minimizar
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    toggleBtn.style.background = 'none';
    toggleBtn.style.border = 'none';
    toggleBtn.style.color = 'white';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.padding = '0';
    toggleBtn.style.fontSize = '16px';
    
    // Estado del panel (abierto/cerrado)
    let panelAbierto = true;
    
    // Función para alternar visibilidad
    toggleBtn.addEventListener('click', () => {
        const contenido = document.getElementById('incidents-content');
        panelAbierto = !panelAbierto;
        
        if (panelAbierto) {
            contenido.style.maxHeight = '300px';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        } else {
            contenido.style.maxHeight = '0';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        }
    });
    
    header.appendChild(toggleBtn);
    panelIncidentes.appendChild(header);
    
    // Crear contenido
    const contenido = document.createElement('div');
    contenido.id = 'incidents-content';
    contenido.style.maxHeight = '300px';
    contenido.style.overflowY = 'auto';
    contenido.style.transition = 'max-height 0.3s ease';
    
    // Lista de incidentes
    const lista = document.createElement('ul');
    lista.id = 'incidents-list';
    lista.style.listStyle = 'none';
    lista.style.padding = '0';
    lista.style.margin = '0';
    
    contenido.appendChild(lista);
    panelIncidentes.appendChild(contenido);
    
    // Añadir estilos CSS para los elementos de la lista
    const style = document.createElement('style');
    style.textContent = `
        .incident-item {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .incident-item:hover {
            background-color: #f9f9f9;
        }
        .incident-item i {
            margin-right: 10px;
            font-size: 18px;
            color: #f44336;
        }
        .incident-info {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .incident-type {
            font-weight: bold;
            text-transform: capitalize;
        }
        .incident-desc {
            font-size: 12px;
            color: #666;
            margin: 2px 0;
        }
        .incident-date {
            font-size: 11px;
            color: #999;
        }
    `;
    document.head.appendChild(style);
    
    // Añadir al DOM
    document.getElementById('map').appendChild(panelIncidentes);
}

// Modificar la función inicializarMapa para añadir la capa de incidentes
function actualizarMapaConIncidentes() {
    // Inicializar la capa de incidentes
    incidentesLayer = L.layerGroup().addTo(map);
    
    // Cargar incidentes al inicio
    cargarIncidentes();
    
    // Actualizar incidentes cuando el mapa se mueva
    map.on('moveend', function() {
        // Solo recargar si el zoom es suficiente
        if (map.getZoom() > 12) {
            cargarIncidentes();
        }
    });
}