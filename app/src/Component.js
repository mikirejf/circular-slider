import Template from './Template';

export default class Component extends Template {
  constructor() {
    super();
    
    this.listeners = {};
    this.props = {};
    this.state = {};
  }

  setState(nextState) {
    this.state = Object.assign({}, this.state, nextState);
    this.update();
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