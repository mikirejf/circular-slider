import Template from './Template';

export default class Component extends Template {
  constructor() {
    super();
    
    this.props = {};
    this.state = {};
  }

  setState(nextState) {
    this.state = Object.assign({}, this.state, nextState);
    this.update();
  }
}