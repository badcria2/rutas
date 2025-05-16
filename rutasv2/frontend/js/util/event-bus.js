/**
 * event-bus.js
 * Simple event bus for communication between modules
 */

class EventBus {
    constructor() {
      this.events = {};
    }
  
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     */
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
      if (!this.events[eventName]) return;
      
      this.events[eventName] = this.events[eventName].filter(
        eventCallback => eventCallback !== callback
      );
    }
  
    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {any} data - Data to pass to the callbacks
     */
    emit(eventName, data) {
      if (!this.events[eventName]) return;
      
      this.events[eventName].forEach(callback => {
        callback(data);
      });
    }
  }
  
  // Create and export a singleton instance
  export const eventBus = new EventBus();
  
  // Define common event names
  export const EVENTS = {
    // Map events
    MAP_INITIALIZED: 'map:initialized',
    MARKER_ADDED: 'marker:added',
    MARKER_REMOVED: 'marker:removed',
    MARKER_MOVED: 'marker:moved',
    
    // Route events
    ROUTE_CALCULATED: 'route:calculated',
    ROUTE_DISPLAY_UPDATED: 'route:display:updated',
    TRANSPORT_MODE_CHANGED: 'route:transport:changed',
    
    // Favorite events
    FAVORITE_ADDED: 'favorite:added',
    FAVORITE_REMOVED: 'favorite:removed',
    FAVORITE_LOADED: 'favorite:loaded',
    
    // Incident events
    INCIDENT_REPORTED: 'incident:reported',
    INCIDENTS_LOADED: 'incidents:loaded',
    
    // UI events
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed'
  };