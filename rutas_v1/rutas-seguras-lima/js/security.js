/**
 * security.js
 * Maneja la funcionalidad relacionada con la seguridad de las rutas,
 * cálculo de niveles de riesgo e incidentes cercanos.
 */

// Módulo de seguridad con patrón revelador
const Security = (function() {
    // Variables privadas
    let securityData = {
        districts: {},
        securityPoints: [],
        incidents: []
    };  // Datos de seguridad (distritos, puntos, incidentes)
    
    /**
     * Inicializa el módulo de seguridad con los datos necesarios
     * @param {Object} data - Datos de seguridad (distritos, puntos, incidentes)
     */
    function init(data) {
        securityData = data;
        console.log('Módulo de seguridad inicializado con datos:', data);
    }
    
    /**
     * Calcula el nivel de seguridad de una ruta basado en los distritos por los que pasa
     * @param {Array} path - Array de puntos [lat, lng] que conforman la ruta
     * @returns {number} - Valor numérico del nivel de seguridad (0-100)
     */
    function calculateRouteSecurityLevel(path) {
        // Validar que tengamos datos de seguridad
        if (!securityData || !securityData.districts || Object.keys(securityData.districts).length === 0) {
            console.warn('Datos de seguridad de distritos no disponibles');
            return 50; // Valor predeterminado si no hay datos
        }
        
        let totalSecurity = 0;
        let districtsCount = 0;
        
        // Para cada punto de la ruta, buscar el distrito más cercano
        path.forEach(point => {
            const district = findNearestDistrict(point);
            if (district && securityData.districts[district]) {
                totalSecurity += securityData.districts[district].securityLevel;
                districtsCount++;
            }
        });
        
        // Si no se encontró ningún distrito, usar un valor predeterminado
        if (districtsCount === 0) return 50;
        
        return Math.round(totalSecurity / districtsCount);
    }
    
    /**
     * Encuentra el distrito más cercano a un punto dado
     * @param {Array} point - Coordenadas del punto [lat, lng]
     * @returns {string|null} - Nombre del distrito más cercano o null si no se encontró
     */
    function findNearestDistrict(point) {
        // Validar que tengamos datos de distritos
        if (!securityData || !securityData.districts || Object.keys(securityData.districts).length === 0) {
            return null;
        }
        
        let nearestDistrict = null;
        let smallestDistance = Infinity;
        
        // Encontrar el distrito más cercano usando los datos de la API
        for (const [districtName, districtData] of Object.entries(securityData.districts)) {
            if (districtData.coordinates) {
                const districtCenter = [districtData.coordinates.lat, districtData.coordinates.lng];
                const distance = Routes.calculateDistance(point, districtCenter);
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    nearestDistrict = districtName;
                }
            }
        }
        
        return nearestDistrict;
    }
    
    /**
     * Encuentra incidentes cercanos a una ruta dada
     * @param {Array} path - Array de puntos [lat, lng] que conforman la ruta
     * @param {number} maxDistance - Distancia máxima en km para considerar un incidente cercano (por defecto 1km)
     * @returns {Array} - Lista de incidentes cercanos a la ruta
     */
    function findNearbyIncidents(path, maxDistance = 1) {
        // Validar que tengamos datos de incidentes
        if (!securityData || !securityData.incidents || securityData.incidents.data.length === 0) {
            console.warn('Datos de incidentes no disponibles');
            return [];
        }
        
        const nearbyIncidents = [];
        
        // Para cada incidente, verificar si está cerca de algún punto de la ruta
        securityData.incidents.data.forEach(incident => {
            const incidentPoint = [incident.lat, incident.lng];
            
            // Verificar la distancia mínima a cualquier punto de la ruta
            let minDistance = Infinity;
            path.forEach(routePoint => {
                const distance = Routes.calculateDistance(incidentPoint, routePoint);
                minDistance = Math.min(minDistance, distance);
            });
            
            // Si está lo suficientemente cerca, añadirlo a la lista
            if (minDistance <= maxDistance) {
                nearbyIncidents.push(incident);
            }
        });
        
        return nearbyIncidents;
    }
    
    /**
     * Evalúa el nivel de seguridad de un punto específico
     * @param {Array} point - Coordenadas del punto [lat, lng]
     * @returns {Object} - Información de seguridad del punto
     */
    function evaluatePointSecurity(point) {
        // Encontrar el distrito más cercano
        const district = findNearestDistrict(point);
        
        // Obtener nivel de seguridad base del distrito
        let securityLevel = district && securityData.districts[district] 
            ? securityData.districts[district].securityLevel 
            : 50;
            
        // Buscar puntos de seguridad cercanos que puedan influir
        const nearbySecurityPoints = findNearbySecurityPoints(point, 0.5);
        
        // Ajustar nivel de seguridad según puntos cercanos
        nearbySecurityPoints.forEach(secPoint => {
            switch(secPoint.securityLevel) {
                case 'high':
                    securityLevel += 5;
                    break;
                case 'medium':
                    securityLevel += 2;
                    break;
                case 'low':
                    securityLevel -= 5;
                    break;
            }
        });
        
        // Buscar incidentes cercanos
        const nearbyIncidents = findNearbyPointIncidents(point, 0.5);
        
        // Ajustar nivel de seguridad según incidentes (cada incidente reduce)
        securityLevel -= nearbyIncidents.length * 3;
        
        // Asegurar que el valor esté entre 0 y 100
        securityLevel = Math.max(0, Math.min(100, securityLevel));
        
        return {
            district,
            securityLevel,
            nearbySecurityPoints,
            nearbyIncidents
        };
    }
    
    /**
     * Encuentra puntos de seguridad cercanos a un punto dado
     * @param {Array} point - Coordenadas del punto [lat, lng]
     * @param {number} maxDistance - Distancia máxima en km (por defecto 0.5km)
     * @returns {Array} - Lista de puntos de seguridad cercanos
     */
    function findNearbySecurityPoints(point, maxDistance = 0.5) {
        if (!securityData || !securityData.securityPoints || securityData.securityPoints.data.length === 0) {
            return [];
        }
        
        return securityData.securityPoints.filter(secPoint => {
            const secPointCoords = [secPoint.lat, secPoint.lng];
            const distance = Routes.calculateDistance(point, secPointCoords);
            return distance <= maxDistance;
        });
    }
    
    /**
     * Encuentra incidentes cercanos a un punto específico
     * @param {Array} point - Coordenadas del punto [lat, lng]
     * @param {number} maxDistance - Distancia máxima en km (por defecto 0.5km)
     * @returns {Array} - Lista de incidentes cercanos
     */
    function findNearbyPointIncidents(point, maxDistance = 0.5) {
        if (!securityData || !securityData.incidents || securityData.incidents.data.length === 0) {
            return [];
        }
        
        return securityData.incidents.filter(incident => {
            const incidentCoords = [incident.lat, incident.lng];
            const distance = Routes.calculateDistance(point, incidentCoords);
            return distance <= maxDistance;
        });
    }
    
    /**
     * Clasifica el nivel de seguridad numérico en una categoría
     * @param {number} securityLevel - Nivel de seguridad (0-100)
     * @returns {string} - Categoría de seguridad ('high', 'medium' o 'low')
     */
    function getSecurityCategory(securityLevel) {
        if (securityLevel >= 70) {
            return 'high';
        } else if (securityLevel >= 50) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    /**
     * Obtiene el color asociado a un nivel de seguridad
     * @param {number} securityLevel - Nivel de seguridad (0-100)
     * @returns {string} - Código hexadecimal de color
     */
    function getSecurityColor(securityLevel) {
        const category = getSecurityCategory(securityLevel);
        const colors = {
            'high': '#27ae60',   // Verde
            'medium': '#f39c12', // Amarillo
            'low': '#e74c3c'     // Rojo
        };
        
        return colors[category];
    }
    
    /**
     * Actualiza los datos de seguridad (por ejemplo, cuando hay nuevos incidentes)
     * @param {string} dataType - Tipo de datos a actualizar ('districts', 'securityPoints', 'incidents')
     * @param {Object|Array} newData - Nuevos datos para actualizar
     */
    function updateSecurityData(dataType, newData) {
        if (!securityData) {
            securityData = {};
        }
        
        if (dataType === 'districts' || dataType === 'securityPoints' || dataType === 'incidents') {
            securityData[dataType] = newData;
            console.log(`Datos de ${dataType} actualizados:`, newData);
        } else {
            console.warn(`Tipo de datos desconocido: ${dataType}`);
        }
    }
    
    /**
     * Obtiene los datos de seguridad actuales
     * @returns {Object} - Datos de seguridad actuales
     */
    function getSecurityData() {
        return securityData;
    }
    
    // Exponer API pública
    return {
        init,
        calculateRouteSecurityLevel,
        findNearbyIncidents,
        evaluatePointSecurity,
        getSecurityCategory,
        getSecurityColor,
        updateSecurityData,
        getSecurityData
    };
})();

// En un sistema real de módulos usaríamos:
// export default Security;

// Al final de security.js (después del patrón revelador)
if (typeof window !== 'undefined') {
    window.Security = Security;
}