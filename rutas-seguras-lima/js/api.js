/**
 * api.js
 * Maneja la comunicación con las APIs de seguridad
 */

// Módulo de API con patrón revelador
const API = (function() {
    // Base URL con puerto específico
    const BASE_URL = 'http://localhost:3000'; // Cambia esto según tu configuración
    
    /**
     * Obtiene datos de los distritos desde la API
     * @returns {Promise} - Promesa con los datos de distritos
     */
    async function fetchDistricts() {
        try {
            console.log('Obteniendo datos de distritos desde:', `${BASE_URL}/api/districts`);
            const response = await fetch(`${BASE_URL}/api/districts`);
            if (!response.ok) {
                throw new Error(`Error al obtener distritos: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener distritos:', error);
            // Mostrar error UI si el módulo UI está disponible
            if (typeof UI !== 'undefined' && UI.showError) {
                UI.showError(`Error al obtener distritos: ${error.message}`);
            }
            return {};
        }
    }

    /**
     * Obtiene datos de puntos de seguridad desde la API
     * @returns {Promise} - Promesa con los datos de puntos de seguridad
     */
    async function fetchSecurityPoints() {
        try {
            console.log('Obteniendo puntos de seguridad desde:', `${BASE_URL}/api/security-points`);
            const response = await fetch(`${BASE_URL}/api/security-points`);
            if (!response.ok) {
                throw new Error(`Error al obtener puntos de seguridad: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener puntos de seguridad:', error);
            if (typeof UI !== 'undefined' && UI.showError) {
                UI.showError(`Error al obtener puntos de seguridad: ${error.message}`);
            }
            return [];
        }
    }

    /**
     * Obtiene datos de incidentes desde la API
     * @returns {Promise} - Promesa con los datos de incidentes
     */
    async function fetchIncidents() {
        try {
            console.log('Obteniendo incidentes desde:', `${BASE_URL}/api/incidents`);
            const response = await fetch(`${BASE_URL}/api/incidents`);
            if (!response.ok) {
                throw new Error(`Error al obtener incidentes: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener incidentes:', error);
            if (typeof UI !== 'undefined' && UI.showError) {
                UI.showError(`Error al obtener incidentes: ${error.message}`);
            }
            return [];
        }
    }

    /**
     * Inicializa el módulo de seguridad cargando todos los datos necesarios
     * @returns {Promise} - Promesa con todos los datos de seguridad
     */
    async function initializeSecurityData() {
        try {
            console.log('Inicializando datos de seguridad...');
            
            // Mostrar indicador de carga si está disponible
            if (typeof UI !== 'undefined' && UI.showLoading) {
                UI.showLoading();
            }
            
            const [districts, securityPoints, incidents] = await Promise.all([
                fetchDistricts(),
                fetchSecurityPoints(),
                fetchIncidents()
            ]);

            const securityData = {
                districts,
                securityPoints,
                incidents
            };

            // Verificar si el módulo Security está disponible antes de llamarlo
            if (typeof Security !== 'undefined') {
                console.log('Inicializando módulo de seguridad con datos recibidos');
                Security.init(securityData);
            } else {
                console.warn('Módulo Security no encontrado. No se pudo inicializar con los datos de la API.');
            }
            
            // Ocultar indicador de carga si está disponible
            if (typeof UI !== 'undefined' && UI.hideLoading) {
                UI.hideLoading();
            }
            
            return securityData;
        } catch (error) {
            console.error('Error al inicializar datos de seguridad:', error);
            
            // Ocultar indicador de carga si está disponible
            if (typeof UI !== 'undefined' && UI.hideLoading) {
                UI.hideLoading();
            }
            
            // Mostrar error en la UI si está disponible
            if (typeof UI !== 'undefined' && UI.showError) {
                UI.showError(`Error al cargar datos de seguridad: ${error.message}`);
            } else if (typeof App !== 'undefined' && App.handleError) {
                App.handleError(error, 'Error al cargar datos de seguridad');
            } else {
                // Fallback si no hay ninguna manera de mostrar errores
                alert('Error al cargar datos de seguridad: ' + error.message);
            }
            
            throw error;
        }
    }

    // Método para cambiar la URL base (útil para cambiar entre entornos)
    function setBaseUrl(newUrl) {
        if (typeof newUrl === 'string' && newUrl.trim() !== '') {
            console.log(`Cambiando URL base de API de ${BASE_URL} a ${newUrl}`);
            BASE_URL = newUrl.trim();
            return true;
        }
        return false;
    }
    
    // Método para verificar conexión con la API
    async function testConnection() {
        try {
            console.log('Probando conexión con API en:', BASE_URL);
            const response = await fetch(`${BASE_URL}/api/health-check`);
            if (response.ok) {
                console.log('Conexión exitosa con la API');
                return true;
            } else {
                console.warn(`API respondió con estado: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            return false;
        }
    }

    // Exponer API pública
    return {
        fetchDistricts,
        fetchSecurityPoints,
        fetchIncidents,
        initializeSecurityData,
        setBaseUrl,
        testConnection,
        getBaseUrl: () => BASE_URL
    };
})();

// Ejecutar inicialización solo si no estamos siendo importados por otro script
if (typeof window !== 'undefined' && !window.isImportingAPI) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM cargado. Iniciando carga de datos desde API...');
        
        // Verificar si UI está disponible antes de mostrar el loading
        if (typeof UI !== 'undefined' && UI.showLoading) {
            UI.showLoading();
        }
        
        // Inicializar datos de seguridad al cargar la página
        API.initializeSecurityData()
            .then(data => {
                console.log('Datos de seguridad cargados correctamente:', data);
                
                // Verificar si Map está disponible antes de cargar los datos
                if (typeof map !== 'undefined') {
                    console.log('Cargando datos en el mapa...');
                    // Cargar puntos en el mapa
                    loadSecurityPoints(data);
                    //loadIncidents(data);
                }
            })
            .catch(error => {
                console.error('Error al cargar datos de seguridad:', error);
            })
            .finally(() => {
                // Ocultar loading independientemente del resultado
                if (typeof UI !== 'undefined' && UI.hideLoading) {
                    UI.hideLoading();
                }
            });
    });
}