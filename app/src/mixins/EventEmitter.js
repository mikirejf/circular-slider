const EventEmitter = {
  emit(event) {
    if (this.listeners && this.listeners[event]) {
      // Removes the `event` argument
      const args = [].slice.call(arguments, 1);

      this.listeners[event].forEach((cb) => {
        cb.apply(this, args);
      });
    }
  },

  on(event, callback) {
    this.listeners = this.listeners || {};
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
};

export default EventEmitter;
