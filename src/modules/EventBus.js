/**
 * EventBus
 * 
 * Simple global Publish-Subscribe Event Bus class.
 * Decouples game components by allowing them to broadcast and listen
 * to state shifts, lock outcomes, CLI executions, and upgrades.
 */
class EventBusClass {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} eventName name of the event
   * @param {Function} callback callback function
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName name of the event
   * @param {Function} callback callback function to remove
   */
  off(eventName, callback) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
  }

  /**
   * Broadcast an event to all subscribers
   * @param {string} eventName name of the event
   * @param {any} data payload parameters
   */
  emit(eventName, data) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`EventBus handler error for ${eventName}:`, e);
      }
    });
  }

  /**
   * Reset all event subscribers
   */
  clear() {
    this.listeners = {};
  }
}

export const EventBus = new EventBusClass();
