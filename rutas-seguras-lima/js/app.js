/**
 * app.js
 * Punto de entrada principal para la aplicación Rutas Seguras Lima.
 * Coordina la inicialización de todos los módulos y gestiona el flujo de la aplicación.
 */

// Objeto principal de la aplicación
const App = (function() {
    // Configuración general de la aplicación
    const config = {
        // Coordenadas de Lima, Perú
        LIMA_CENTER: [-12.0464, -77.0428],
        DEFAULT_ZOOM: 12
    };
    
    /**
     * Inicializa la aplicación cuando el DOM está completamente cargado
     */
    function init() {
        console.log('Inicializando aplicación Rutas Seguras Lima...');
        
        // Inicializar datos (cargar datos mockeados)
        Data.init();
        
        // Inicializar el mapa y obtener instancia
        const mapInstance = Map.init(
            'map', 
            config.LIMA_CENTER, 
            config.DEFAULT_ZOOM
        );
        
        // Inicializar módulos con sus dependencias
        Security.init(Data.getSecurityData());
        Routes.init(mapInstance);
        UI.init({
            routeFormId: 'route-form',
            loadingId: 'loading',
            routeInfoId: 'route-info'
        });
        
        // Cargar puntos de seguridad e incidentes en el mapa
        Map.loadSecurityPoints(Data.getSecurityPoints());
        Map.loadIncidents(Data.getIncidents());
        
        // Configurar eventos de la interfaz de usuario
        setupEventListeners();
        
        console.log('Aplicación inicializada correctamente');
    }
    
    /**
     * Configura los escuchadores de eventos para interacciones del usuario
     */
    function setupEventListeners() {
        // Obtener elemento del formulario para búsqueda de rutas
        const routeForm = document.getElementById('route-form');
        
        // Agregar evento para el formulario de búsqueda de ruta
        routeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener valores de origen y destino
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            
            // Validar que ambos campos estén completos
            if (origin && destination) {
                // Buscar y mostrar ruta segura
                Routes.findSecureRoute(origin, destination)
                    .then(route => {
                        console.log('Ruta calculada:', route);
                    })
                    .catch(error => {
                        console.error('Error al calcular ruta:', error);
                        UI.showError('No se pudo calcular la ruta. Por favor, intente nuevamente.');
                    });
            } else {
                UI.showError('Por favor complete ambos campos: origen y destino.');
            }
        });
        
        // Aquí se pueden agregar más eventos según sea necesario
        console.log('Eventos configurados correctamente');
    }
    
    
    
    // Registrar evento para inicializar la aplicación cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        try {
            init();
        } catch (error) {
            handleError(error);
        }
    });
    
    // Exponer API pública (muy limitada para este módulo principal)
    return {
        getConfig: function() {
            return {...config}; // Devolver copia para evitar modificaciones externas
        }
    };
})();

// En un sistema real de módulos usaríamos:
// export default App;