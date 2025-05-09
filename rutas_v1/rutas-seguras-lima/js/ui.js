/**
 * ui.js - Funciones de interfaz de usuario para Rutas Seguras Lima
 */

// Módulo UI con patrón revelador
const UI = (function() {
    // Configuración de elementos de la UI
    let config = {
        routeFormId: 'route-form',
        loadingId: 'loading',
        routeInfoId: 'route-info',
        errorContainerId: 'error-container',
        errorMessageId: 'error-message',
        routeControlsId: 'route-controls',
        routeOptionsListId: 'route-options-list',
        favoriteRoutesListId: 'favorite-routes-list'
    };
    
    // Timeout para mensajes de error
    let errorTimeout = null;
    
    /**
     * Inicializa el módulo UI con configuración personalizada
     * @param {Object} customConfig - Configuración personalizada
     */
    function init(customConfig = {}) {
        // Combinar configuración personalizada con la predeterminada
        config = { ...config, ...customConfig };
        
        console.log('Módulo UI inicializado con configuración:', config);
        
        // Configurar eventos para cerrar mensajes de error al hacer clic
        const errorContainer = document.getElementById(config.errorContainerId);
        if (errorContainer) {
            errorContainer.addEventListener('click', hideError);
        }
    }
    
    /**
     * Muestra el indicador de carga
     */
    function showLoading() {
        const loading = document.getElementById(config.loadingId);
        if (loading) {
            loading.style.display = 'block';
        }
    }
    
    /**
     * Oculta el indicador de carga
     */
    function hideLoading() {
        const loading = document.getElementById(config.loadingId);
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error a mostrar
     * @param {boolean} autoHide - Si es true, el mensaje se ocultará automáticamente
     * @param {number} duration - Duración en ms antes de ocultar (si autoHide es true)
     */
    function showError(message, autoHide = false, duration = 5000) {
        const errorContainer = document.getElementById(config.errorContainerId);
        const errorMessage = document.getElementById(config.errorMessageId);
        
        if (errorContainer && errorMessage) {
            // Limpiar timeout anterior si existe
            if (errorTimeout) {
                clearTimeout(errorTimeout);
                errorTimeout = null;
            }
            
            // Establecer mensaje y mostrar contenedor
            errorMessage.textContent = message;
            errorContainer.style.display = 'flex';
            
            // Si autoHide es true, programar para ocultar después de la duración
            if (autoHide) {
                errorTimeout = setTimeout(() => {
                    hideError();
                }, duration);
            }
        } else {
            // Fallback si los elementos no existen
            console.error('Error:', message);
            alert(message);
        }
    }
    
    /**
     * Oculta el mensaje de error
     */
    function hideError() {
        const errorContainer = document.getElementById(config.errorContainerId);
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        
        // Limpiar timeout si existe
        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }
    }
    
    /**
     * Muestra el panel de información de ruta
     */
    function showRouteInfo() {
        const routeInfo = document.getElementById(config.routeInfoId);
        
        if (routeInfo) {
            routeInfo.style.display = 'block';
            
            // Mostrar botón de favoritos si hay una ruta activa
            const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
            if (addToFavoritesBtn) {
                addToFavoritesBtn.style.display = 'block';
            }
        }
    }
    
    /**
     * Oculta el panel de información de ruta
     */
    function hideRouteInfo() {
        const routeInfo = document.getElementById(config.routeInfoId);
        
        if (routeInfo) {
            routeInfo.style.display = 'none';
            
            // Ocultar botón de favoritos
            const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
            if (addToFavoritesBtn) {
                addToFavoritesBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * Actualiza la información de la ruta en el panel lateral
     * @param {Object} route - Objeto con la información de la ruta
     */
    function updateRouteInfo(route) {
        if (!route) {
            console.error('No se proporcionó información de ruta');
            return;
        }
        
        // Actualizar la información de la ruta en el panel lateral
        const distanceElement = document.getElementById('route-distance');
        const timeElement = document.getElementById('route-time');
        const securityFill = document.getElementById('security-level-fill');
        const securityPercentage = document.getElementById('security-percentage');
        
        if (distanceElement) distanceElement.textContent = route.distance;
        if (timeElement) timeElement.textContent = route.timeMinutes;
        
        // Actualizar nivel de seguridad
        if (securityFill && securityPercentage) {
            securityFill.style.width = `${route.securityLevel}%`;
            securityPercentage.textContent = `${route.securityLevel}%`;
            
            // Establecer el color según el nivel de seguridad
            if (route.securityLevel >= 70) {
                securityFill.style.backgroundColor = '#27ae60'; // Verde para alta seguridad
            } else if (route.securityLevel >= 50) {
                securityFill.style.backgroundColor = '#f39c12'; // Amarillo para seguridad media
            } else {
                securityFill.style.backgroundColor = '#e74c3c'; // Rojo para baja seguridad
            }
        }
        
        // Mostrar incidentes cercanos
        updateIncidentsList(route.nearbyIncidents);
        
        // Mostrar panel de información
        showRouteInfo();
    }
    
    /**
     * Actualiza la lista de incidentes cercanos
     * @param {Array} incidents - Array de incidentes cercanos
     */
    function updateIncidentsList(incidents) {
        const incidentList = document.getElementById('incident-list');
        
        if (!incidentList) return;
        
        incidentList.innerHTML = '';
        
        if (!incidents || incidents.length === 0) {
            incidentList.innerHTML = '<div class="incident-item">No se encontraron incidentes cercanos</div>';
            return;
        }
        
        incidents.forEach(incident => {
            const incidentItem = document.createElement('div');
            incidentItem.className = 'incident-item';
            
            // Determinar icono según tipo de incidente
            let icon = '⚠️';
            switch (incident.type) {
                case 'theft':
                    icon = '🔍';
                    break;
                case 'assault':
                    icon = '⚠️';
                    break;
                case 'harassment':
                    icon = '👁️';
                    break;
                case 'suspicious':
                    icon = '🚨';
                    break;
            }
            
            // Formatear fecha
            const date = incident.date ? new Date(incident.date) : new Date();
            const formattedDate = date.toLocaleDateString('es-PE');
            
            incidentItem.innerHTML = `
                <div class="incident-icon">${icon}</div>
                <div class="incident-details">
                    <strong>${incident.type || 'Incidente'}:</strong> ${incident.description || 'Sin descripción'} 
                    <span class="incident-date">(${formattedDate})</span>
                </div>
            `;
            
            incidentList.appendChild(incidentItem);
        });
    }
    
    /**
     * Muestra las opciones de rutas alternativas
     * @param {Array} routes - Array de objetos de ruta
     * @param {Function} onRouteSelect - Función a llamar cuando se selecciona una ruta
     */
    function showRouteOptions(routes, onRouteSelect) {
        if (!routes || routes.length <= 1) return;
        
        const routeControls = document.getElementById(config.routeControlsId);
        const routeOptionsList = document.getElementById(config.routeOptionsListId);
        
        if (!routeControls || !routeOptionsList) return;
        
        // Limpiar lista existente
        routeOptionsList.innerHTML = '';
        
        // Nombres y colores para las rutas
        const routeStyles = [
            { name: 'Ruta principal', color: '#3498db' },
            { name: 'Alternativa 1', color: '#27ae60' },
            { name: 'Alternativa 2', color: '#e67e22' }
        ];
        
        // Crear opciones para cada ruta
        routes.forEach((route, index) => {
            const style = routeStyles[index] || { name: `Alternativa ${index}`, color: '#95a5a6' };
            
            const routeOption = document.createElement('div');
            routeOption.className = 'route-option';
            if (index === 0) routeOption.classList.add('active');
            
            // Datos para identificar la ruta
            routeOption.dataset.routeIndex = index;
            
            routeOption.innerHTML = `
                <div class="route-color-indicator" style="background-color: ${style.color};"></div>
                <div class="route-option-info">
                    <div>${style.name}</div>
                    <div>${route.distance} km - ${route.timeMinutes} min</div>
                </div>
            `;
            
            // Evento al hacer clic en una opción
            routeOption.addEventListener('click', function() {
                // Cambiar clase activa
                document.querySelectorAll('.route-option').forEach(el => {
                    el.classList.remove('active');
                });
                routeOption.classList.add('active');
                
                // Llamar al callback con el índice de la ruta
                if (typeof onRouteSelect === 'function') {
                    onRouteSelect(index);
                }
            });
            
            routeOptionsList.appendChild(routeOption);
        });
        
        // Mostrar el control
        routeControls.style.display = 'block';
    }
    
    /**
     * Oculta las opciones de rutas alternativas
     */
    function hideRouteOptions() {
        const routeControls = document.getElementById(config.routeControlsId);
        
        if (routeControls) {
            routeControls.style.display = 'none';
        }
    }
    
    /**
     * Muestra las rutas favoritas en la lista
     * @param {Array} routes - Array de objetos de ruta favorita
     */
    function displayFavoriteRoutes(routes) {
        const favoritesList = document.getElementById(config.favoriteRoutesListId);
        
        if (!favoritesList) return;
        
        favoritesList.innerHTML = '';
        
        if (!routes || routes.length === 0) {
            favoritesList.innerHTML = '<p class="no-favorites">No hay rutas favoritas guardadas.</p>';
            return;
        }
        
        routes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.classList.add('favorite-route-item');
            
            // Obtener nombres de origen y destino
            const originName = route.origin ? route.origin.name || 'Origen' : 'Origen';
            const destName = route.destination ? route.destination.name || 'Destino' : 'Destino';
            
            // Determinar nivel de seguridad
            let securityClass = 'security-medium';
            if (route.securityLevel >= 70) {
                securityClass = 'security-high';
            } else if (route.securityLevel < 50) {
                securityClass = 'security-low';
            }
            
            // Formatear fecha si existe
            let dateStr = '';
            if (route.timestamp) {
                const date = new Date(route.timestamp);
                dateStr = `<div class="favorite-date">Guardada: ${date.toLocaleDateString('es-PE')}</div>`;
            }
            
            routeItem.innerHTML = `
                <div class="favorite-route-header">
                    <div class="favorite-route-name">${originName} → ${destName}</div>
                    <div class="favorite-route-actions">
                        <button class="btn-show-route" data-route-id="${route.id || ''}">
                            <i class="fas fa-map-marked-alt"></i>
                        </button>
                        <button class="btn-delete-route" data-route-id="${route.id || ''}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="favorite-route-info">
                    <div class="favorite-route-stats">
                        <span>${route.distance} km</span>
                        <span>${route.timeMinutes} min</span>
                        <span class="${securityClass}">${route.securityLevel}% seg.</span>
                    </div>
                    ${dateStr}
                </div>
            `;
            
            // Eventos para botones de acciones
            routeItem.querySelector('.btn-show-route').addEventListener('click', () => {
                // Intentar mostrar la ruta en el mapa
                if (typeof Routes !== 'undefined' && Routes.displayRoute && route.path) {
                    Routes.displayRoute({
                        path: route.path,
                        distance: route.distance,
                        timeMinutes: route.timeMinutes,
                        securityLevel: route.securityLevel,
                        nearbyIncidents: route.nearbyIncidents || []
                    });
                    
                    // Actualizar información de la ruta
                    updateRouteInfo({
                        distance: route.distance,
                        timeMinutes: route.timeMinutes,
                        securityLevel: route.securityLevel,
                        nearbyIncidents: route.nearbyIncidents || []
                    });
                    
                    // Si hay origen y destino, crear marcadores
                    if (route.origin && route.destination && typeof Routes.createRouteMarkers === 'function') {
                        Routes.createRouteMarkers(
                            route.origin.name || 'Origen',
                            route.origin.coordinates,
                            route.destination.name || 'Destino',
                            route.destination.coordinates
                        );
                    }
                } else {
                    showError('No se puede mostrar esta ruta en el mapa.', true, 3000);
                }
            });
            
            // Evento para eliminar ruta
            routeItem.querySelector('.btn-delete-route').addEventListener('click', () => {
                if (typeof API !== 'undefined' && API.deleteFavoriteRoute && route.id) {
                    API.deleteFavoriteRoute(route.id)
                        .then(() => {
                            return API.getFavoriteRoutes();
                        })
                        .then(updatedRoutes => {
                            displayFavoriteRoutes(updatedRoutes);
                            showError('Ruta eliminada de favoritos', true, 3000);
                        })
                        .catch(error => {
                            console.error('Error al eliminar ruta:', error);
                            showError('Error al eliminar la ruta', true, 3000);
                        });
                } else {
                    showError('No se puede eliminar esta ruta', true, 3000);
                }
            });
            
            favoritesList.appendChild(routeItem);
        });
    }
    
    // Exponer API pública
    return {
        init,
        showLoading,
        hideLoading,
        showError,
        hideError,
        showRouteInfo,
        hideRouteInfo,
        updateRouteInfo,
        showRouteOptions,
        hideRouteOptions,
        displayFavoriteRoutes
    };
})();

// Si estamos en un navegador, registrar en window
if (typeof window !== 'undefined') {
    window.UI = UI;
}