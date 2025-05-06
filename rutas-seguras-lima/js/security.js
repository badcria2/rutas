/**
 * security.js
 * Maneja la funcionalidad relacionada con la seguridad de las rutas,
 * cálculo de niveles de riesgo e incidentes cercanos.
 */

// Módulo de seguridad con patrón revelador
const Security = (function() {
    // Variables privadas
    let securityData = null;  // Datos de seguridad (distritos, puntos, incidentes)
    
    /**
     * Inicializa el módulo de seguridad con los datos necesarios
     * @param {Object} data - Datos de seguridad (distritos, puntos, incidentes)
     */
    function init(data) {
        securityData = data;
        console.log('Módulo de seguridad inicializado');
    }
    
    /**
     * Calcula el nivel de seguridad de una ruta basado en los distritos por los que pasa
     * @param {Array} path - Array de puntos [lat, lng] que conforman la ruta
     * @returns {number} - Valor numérico del nivel de seguridad (0-100)
     */
    function calculateRouteSecurityLevel(path) {
        // Validar que tengamos datos de seguridad
        if (!securityData || !securityData.districts) {
            console.warn('Datos de seguridad no disponibles');
            return 50; // Valor predeterminado si no hay datos
        }
        
        let totalSecurity = 0;
        let districtsCount = 0;
        
        // Para cada punto de la ruta, buscar el distrito más cercano
        path.forEach(point => {
            const district = findNearestDistrict(point);
            if (district && securityData.districts[district]) {
                totalSecurity += securityData.districts[district];
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
        if (!securityData || !securityData.districts) {
            return null;
        }
        
        // Coordenadas aproximadas de los centros de los distritos
        const districtCenters = {
            'Miraflores': [-12.1219, -77.0297],
            'San Isidro': [-12.0977, -77.0365],
            'Surco': [-12.1450, -76.9917],
            'Barranco': [-12.1495, -77.0219],
            'San Borja': [-12.1019, -76.9975],
            'La Molina': [-12.0867, -76.9055],
            'Jesús María': [-12.0705, -77.0517],
            'Lince': [-12.0833, -77.0333],
            'San Miguel': [-12.0789, -77.0825],
            'Magdalena': [-12.0889, -77.0717],
            'Pueblo Libre': [-12.0717, -77.0633],
            'Lima Centro': [-12.0464, -77.0428],
            'Rimac': [-12.0292, -77.0428],
            'San Juan de Lurigancho': [-12.0031, -77.0081],
            'Villa El Salvador': [-12.2136, -76.9319],
            'San Juan de Miraflores': [-12.1550, -76.9700],
            'La Victoria': [-12.0650, -77.0150],
            'Ate': [-12.0258, -76.9178],
            'Callao': [-12.0500, -77.1200]
        };
        
        let nearestDistrict = null;
        let smallestDistance = Infinity;
        
        // Encontrar el distrito más cercano
        for (const [district, center] of Object.entries(districtCenters)) {
            const distance = Routes.calculateDistance(point, center);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                nearestDistrict = district;
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
        if (!securityData || !securityData.incidents) {
            console.warn('Datos de incidentes no disponibles');
            return [];
        }
        
        const nearbyIncidents = [];
        
        // Para cada incidente, verificar si está cerca de algún punto de la ruta
        securityData.incidents.forEach(incident => {
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
            ? securityData.districts[district] 
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
        if (!securityData || !securityData.securityPoints) {
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
        if (!securityData || !securityData.incidents) {
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
    
    // Exponer API pública
    return {
        init,
        calculateRouteSecurityLevel,
        findNearbyIncidents,
        evaluatePointSecurity,
        getSecurityCategory,
        getSecurityColor
    };
})();

// En un sistema real de módulos usaríamos:
// export default Security;