/**
 * notification.service.js
 * Handles displaying notifications to the user
 */

/**
 * Shows a temporary notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notificacion ${type}`;
    notification.textContent = message;
  
    // Apply styles
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
  
    // Set color based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        break;
      default: // info
        notification.style.backgroundColor = '#2196F3';
        notification.style.color = 'white';
    }
  
    // Add to DOM
    document.body.appendChild(notification);
  
    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
  
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, duration);
}