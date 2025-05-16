/**
 * constants.js
 * Central configuration for the application
 */

// API endpoints configuration
export const API = {
    BASE_URL: 'https://rutas-rywi.onrender.com',
    ENDPOINTS: {
      ROUTE: '/api/ruta-visual',
      FAVORITES: '/api/ruta-favorita',
      INCIDENTS: '/api/incidentes',
      SECURITY_POINTS: '/api/puntos-seguridad'
    }
  };
  
  // Map configuration
  export const MAP_CONFIG = {
    CENTER: [-12.0464, -77.0428], // Lima, Peru center coordinates
    INITIAL_ZOOM: 13,
    MIN_ZOOM: 8,
    MAX_ZOOM: 19,
    TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };
  
  // Transport modes
  export const TRANSPORT_MODES = {
    CAR: 'driving-car',
    WALKING: 'foot-walking',
    CYCLING: 'cycling-regular',
    
    getDisplayName(mode) {
      switch(mode) {
        case this.CAR: return 'Auto';
        case this.WALKING: return 'A pie';
        case this.CYCLING: return 'Bicicleta';
        default: return 'Desconocido';
      }
    }
  };
  
  // Default locations for quick access
  export const DEFAULT_LOCATIONS = [
    { nombre: "Miraflores", lat: -12.1186, lng: -77.0318 },
    { nombre: "San Isidro", lat: -12.1050, lng: -77.0380 },
    { nombre: "Barranco", lat: -12.1400, lng: -77.0270 },
    { nombre: "San Borja", lat: -12.1089, lng: -77.0047 }
  ];
  
  // Incident types
  export const INCIDENT_TYPES = {
    ROBBERY: 'robo',
    HARASSMENT: 'acoso',
    LIGHTING: 'iluminacion',
    TRAFFIC: 'transito',
    OTHER: 'otro'
  };
  
  // CSS Classes
  export const CSS_CLASSES = {
    ACTIVE: 'activo',
    HIDDEN: 'hidden',
    DISABLED: 'disabled'
  };