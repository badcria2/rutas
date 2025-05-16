/**
 * api.service.js
 * Handles all API communication
 */

import { API } from '../config/constants.js';
import { showNotification } from './notification.service.js';

/**
 * Generic function to make API requests
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request payload (for POST, PUT)
 * @param {URLSearchParams} params - URL parameters
 * @returns {Promise} Promise with the response data
 */
async function makeRequest(endpoint, method = 'GET', data = null, params = null) {
  try {
    const url = new URL(API.BASE_URL + endpoint);
    
    // Add URL parameters if provided
    if (params) {
      url.search = params.toString();
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    showNotification(`Error de comunicación con el servidor: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Get visual route between two points
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {string} transportMode - Transport mode
 * @returns {Promise} Route data
 */
export async function getVisualRoute(origin, destination, transportMode) {
  const params = new URLSearchParams({
    origen_lat: origin.lat,
    origen_lng: origin.lng,
    destino_lat: destination.lat,
    destino_lng: destination.lng,
    modo: transportMode
  });

  return makeRequest(API.ENDPOINTS.ROUTE, 'GET', null, params);
}

/**
 * Get security points
 * @returns {Promise} Security points data
 */
export async function getSecurityPoints() {
  return makeRequest(API.ENDPOINTS.SECURITY_POINTS);
}

/**
 * Get incidents near a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @returns {Promise} Incidents data
 */
export async function getIncidents(lat, lng, radius = 5000) {
  const params = new URLSearchParams({
    lat,
    lng,
    radio: radius
  });

  return makeRequest(API.ENDPOINTS.INCIDENTS, 'GET', null, params);
}

/**
 * Report a new incident
 * @param {Object} incident - Incident data
 * @returns {Promise} Created incident data
 */
export async function reportIncident(incident) {
  return makeRequest(API.ENDPOINTS.INCIDENTS, 'POST', incident);
}

/**
 * Get favorite routes
 * @returns {Promise} Favorite routes data
 */
export async function getFavoriteRoutes() {
  return makeRequest(API.ENDPOINTS.FAVORITES);
}

/**
 * Save a route as favorite
 * @param {Object} route - Route data
 * @returns {Promise} Created favorite route data
 */
export async function saveFavoriteRoute(route) {
  return makeRequest(API.ENDPOINTS.FAVORITES, 'POST', route);
}

/**
 * Delete a favorite route
 * @param {string|number} id - Route ID
 * @returns {Promise} Result of the operation
 */
export async function deleteFavoriteRoute(id) {
  return makeRequest(`${API.ENDPOINTS.FAVORITES}/${id}`, 'DELETE');
}