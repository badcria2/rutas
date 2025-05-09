/**
 * app.js
 * Punto de entrada principal para la aplicación Rutas Seguras Lima.
 * Coordina la inicialización de todos los módulos y gestiona el flujo de la aplicación.
 */

// Objeto principal de la aplicación
const App = (function () {
    // Configuración general de la aplicación
    const config = {
        // Coordenadas de Lima, Perú
        LIMA_CENTER: [-12.0464, -77.0428],
        DEFAULT_ZOOM: 12,
        // Modo de datos: 'api' para datos desde API, 'mock' para datos de prueba
        DATA_MODE: 'api', // Cambiar a 'mock' para usar datos ficticios de data.js
        // URL de la API
        API_URL: 'https://rutas-rywi.onrender.com',
        // Configuración de OpenRouteService
        USE_OPENROUTESERVICE: true, // Habilitar/deshabilitar uso de OpenRouteService
        ORS_API_KEY: '5b3ce3597851110001cf6248b34c77f6a3e24ae0afb25b0b33e7be44', // API key para pruebas
        DEFAULT_ROUTE_PROFILE: 'foot-walking' // Perfil de ruta por defecto (foot-walking, cycling-regular, driving-car)
    };

    // Referencia al timeout de reconexión
    let reconnectTimeout = null;

    /**
     * Verifica si un módulo está definido y disponible
     * @param {string} moduleName - Nombre del módulo a verificar
     * @returns {boolean} - true si el módulo está disponible
     */
    function checkModule(moduleName) {
        if (typeof window[moduleName] === 'undefined') {
            console.error(`Módulo ${moduleName} no encontrado. Asegúrate de que el script está cargado correctamente.`);
            return false;
        }
        return true;
    }

    /**
     * Inicializa la aplicación
     */
    function init() {
        console.log('Inicializando aplicación Rutas Seguras Lima...');

        try {
            // Verificar que todos los módulos necesarios estén disponibles
            let requiredModules = ['UI', 'MapManager', 'Security', 'Routes'];

            // Agregar los módulos de datos necesarios según la configuración
            if (config.DATA_MODE === 'api') {
                requiredModules.push('API');
            } else {
                requiredModules.push('Data');
            }

            // Verificar si OpenRouteService está habilitado
            if (config.USE_OPENROUTESERVICE) {
                requiredModules.push('OpenRouteService');
            }

            const missingModules = requiredModules.filter(module => !checkModule(module));

            if (missingModules.length > 0) {
                throw new Error(`Faltan módulos requeridos: ${missingModules.join(', ')}`);
            }

            // Inicializar UI primero para poder mostrar mensajes
            UI.init({
                routeFormId: 'route-form',
                loadingId: 'loading',
                routeInfoId: 'route-info'
            });

            // Mostrar indicador de carga al iniciar
            UI.showLoading();

            // Inicializar el mapa
            const mapInstance = MapManager.init(
                'map',
                config.LIMA_CENTER,
                config.DEFAULT_ZOOM
            );

            // Inicializar módulo de rutas
            Routes.init(mapInstance);

            // Si OpenRouteService está habilitado, configurarlo
            // Parte de app.js a modificar

            // Si OpenRouteService está habilitado, configurarlo
            if (config.USE_OPENROUTESERVICE && checkModule('OpenRouteService')) {
                console.log('Configurando OpenRouteService');

                // Configurar API key si está definida
                if (config.ORS_API_KEY) {
                    OpenRouteService.setApiKey(config.ORS_API_KEY);

                    // En lugar de esperar la respuesta y bloquear la inicialización,
                    // manejar la verificación de conexión de forma asíncrona
                    setTimeout(() => {
                        OpenRouteService.testConnection()
                            .then(connected => {
                                if (connected) {
                                    console.log('Conexión exitosa con OpenRouteService');
                                } else {
                                    console.warn('No se pudo conectar con OpenRouteService');
                                    UI.showError('No se pudo conectar con OpenRouteService. Se usarán rutas simuladas.', true, 5000);
                                    Routes.setUseOpenRouteService(false);
                                }
                            })
                            .catch(error => {
                                console.error('Error al conectar con OpenRouteService:', error);
                                UI.showError('Error al conectar con OpenRouteService. Se usarán rutas simuladas.', true, 5000);
                                Routes.setUseOpenRouteService(false);
                            });
                    }, 100);
                } else {
                    console.warn('No se ha configurado API key para OpenRouteService');
                    UI.showError('Se requiere una API key para OpenRouteService. Las rutas serán simuladas.', true, 5000);
                    // Deshabilitar OpenRouteService si no hay API key
                    Routes.setUseOpenRouteService(false);
                }
            } else if (config.USE_OPENROUTESERVICE) {
                console.warn('Módulo OpenRouteService no encontrado. Se usarán rutas simuladas.');
            }

            // Cargar datos según el modo configurado
            if (config.DATA_MODE === 'api') {
                console.log('Usando datos desde API');

                // Si estamos usando la API, configurar la URL base
                if (API.setBaseUrl) {
                    API.setBaseUrl(config.API_URL);
                }

                // Cargar datos desde la API
                loadDataFromAPI();
            } else {
                console.log('Usando datos mockeados');

                // Si estamos usando datos mockeados, inicializar desde el módulo Data
                Data.init();

                // Inicializar módulo de seguridad con los datos mockeados
                Security.init(Data.getSecurityData());

                // Cargar puntos en el mapa
                MapManager.loadSecurityPoints(Data.getSecurityPoints());
                //MapManager.loadIncidents(Data.getIncidents());

                // Ocultar indicador de carga
                UI.hideLoading();

                // Configurar eventos
                setupEventListeners();

                console.log('Aplicación inicializada correctamente con datos mockeados');
            }
        } catch (error) {
            handleError(error, 'Error al inicializar la aplicación');

            // Intentar ocultar el indicador de carga
            if (typeof UI !== 'undefined' && UI.hideLoading) {
                UI.hideLoading();
            }
        }
    }

    /**
     * Carga datos desde la API
     */
    function loadDataFromAPI() {
        console.log('Cargando datos desde API...');

        // Primero verificar conexión
        API.testConnection()
            .then(isConnected => {
                if (isConnected) {
                    return API.initializeSecurityData();
                } else {
                    throw new Error('No se pudo conectar con la API');
                }
            })
            .then(data => {
                console.log('Datos cargados correctamente desde API:', data);

                // Inicializar módulo de seguridad con los datos
                Security.init(data);

                // Configurar eventos de la interfaz
                setupEventListeners();

                // Ocultar indicador de carga
                UI.hideLoading();

                console.log('Aplicación inicializada correctamente con datos de API');
            })
            .catch(error => {
                console.error('Error al cargar datos desde API:', error);

                // Intentar reconectar automáticamente después de un tiempo
                scheduleReconnect();

                // Mostrar error al usuario
                handleError(error, 'Error al conectar con el servidor. Intentando reconectar...');

                // Ocultar indicador de carga
                UI.hideLoading();
            });
    }

    /**
     * Programa un intento de reconexión
     */
    function scheduleReconnect() {
        // Limpiar timeout anterior si existe
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }

        // Programar reconexión después de 10 segundos
        reconnectTimeout = setTimeout(() => {
            console.log('Intentando reconectar con el servidor...');
            UI.showError('Intentando reconectar con el servidor...', true, 3000);
            loadDataFromAPI();
        }, 10000);
    }

    /**
     * Configura los escuchadores de eventos para interacciones del usuario
     */
    function setupEventListeners() {
        try {
            // Obtener elemento del formulario para búsqueda de rutas
            const routeForm = document.getElementById('route-form');

            if (!routeForm) {
                throw new Error('No se encontró el formulario de rutas');
            }

            // Agregar evento para el formulario de búsqueda de ruta
            routeForm.addEventListener('submit', function (e) {
                e.preventDefault();

                try {
                    // Mostrar indicador de carga
                    UI.showLoading();

                    // Obtener valores de origen y destino
                    const origin = document.getElementById('origin').value;
                    const destination = document.getElementById('destination').value;

                    // Validar que ambos campos estén completos
                    if (origin && destination) {
                        // Opciones de ruta según configuración
                        const routeOptions = {
                            profile: config.DEFAULT_ROUTE_PROFILE,
                            showAlternatives: false
                        };

                        // Buscar y mostrar ruta segura
                        Routes.findSecureRoute(origin, destination, routeOptions)
                            .then(route => {
                                console.log('Ruta calculada:', route);
                                UI.updateRouteInfo(route);
                                UI.hideLoading();
                            })
                            .catch(error => {
                                handleError(error, 'No se pudo calcular la ruta. Por favor, intente nuevamente.');
                                UI.hideLoading();
                            });
                    } else {
                        UI.hideLoading();
                        UI.showError('Por favor complete ambos campos: origen y destino.');
                    }
                } catch (error) {
                    handleError(error, 'Error al procesar la solicitud de ruta');
                    UI.hideLoading();
                }
            });

            // Agregar evento para cerrar errores al hacer clic en ellos
            const errorContainer = document.getElementById('error-container');
            if (errorContainer) {
                errorContainer.addEventListener('click', function () {
                    UI.hideError();
                });
            }

            console.log('Eventos configurados correctamente');
        } catch (error) {
            handleError(error, 'Error al configurar los eventos');
        }

        try {
            // Evento para cargar y mostrar rutas favoritas al cargar la página
            document.addEventListener('DOMContentLoaded', () => {
                if (API.getFavoriteRoutes) {
                    API.getFavoriteRoutes()
                        .then(routes => {
                            UI.displayFavoriteRoutes(routes);
                        })
                        .catch(error => {
                            handleError(error, 'Error al cargar las rutas favoritas.');
                        });
                }
            });

            // Evento para añadir ruta a favoritos
            const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
            if (addToFavoritesBtn) {
                addToFavoritesBtn.addEventListener('click', () => {
                    const currentRoute = Routes.getCurrentRoute(); // Obtener la ruta actual
                    if (currentRoute && API.addFavoriteRoute) {
                        API.addFavoriteRoute(currentRoute)
                            .then(() => {
                                return API.getFavoriteRoutes();
                            })
                            .then(routes => {
                                UI.displayFavoriteRoutes(routes);
                                UI.showError('Ruta añadida a favoritos correctamente', true, 3000);
                            })
                            .catch(error => {
                                handleError(error, 'Error al guardar la ruta en favoritos.');
                            });
                    } else {
                        UI.showError('No hay una ruta disponible para guardar.');
                    }
                });
            }
        } catch (error) {
            handleError(error, 'Error al configurar los eventos de favoritos');
        }
    }

    /**
     * Manejador global de errores
     * @param {Error} error - Objeto de error capturado
     * @param {string} userMessage - Mensaje amigable para mostrar al usuario
     */
    function handleError(error, userMessage = 'Ocurrió un error en la aplicación') {
        // Registrar error detallado en la consola para depuración
        console.error('Error en la aplicación:', error);

        // Mostrar mensaje amigable al usuario
        if (typeof UI !== 'undefined' && UI.showError) {
            UI.showError(userMessage);
        } else {
            // Fallback si el módulo UI no está disponible
            alert(userMessage);
        }

        // Si es un error fatal, también podemos mostrar una UI de error más completa
        if (error.fatal) {
            // Implementar lógica para errores fatales
            document.body.innerHTML = `
                <div class="fatal-error">
                    <h2>Error en la aplicación</h2>
                    <p>${userMessage}</p>
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    // Exponer API pública
    return {
        init,
        getConfig: function () {
            return { ...config }; // Devolver copia para evitar modificaciones externas
        },
        handleError, // Exponer para uso externo en caso necesario
        reloadData: loadDataFromAPI // Permitir recargar datos manualmente
    };
})();

// Registrar en el objeto global window
if (typeof window !== 'undefined') {
    window.App = App;
}

console.log('Módulo App cargado correctamente');