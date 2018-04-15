class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  emit(event) {
    if (this.listeners[event]) {
      // Remove the `event` argument
      const args = [].slice.call(arguments, 1);

      this.listeners[event].forEach(function (cb) {
        // TODO: maybe executine in the context of `this`?
        cb.apply(window, args);
      });
    }
  }

  on(event, callback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
}
