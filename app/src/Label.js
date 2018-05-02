import Template from "./mixins/Template";

class Label {
  constructor(props) {
    this.props = props;
    this.state = {
      value: ''
    };

    this.render();
  }

  set value (value) {
    this.state.value = value;
    this.update();
  }

  get value () {
    return this.state.value;
  }

  render() {
    // Added classes, because "native" inline styles just don't work well
    // with CSS responsive design
    this.template`
      <li class="slider-label">
        <span class="value" ref="valueNode">${this.state.value}</span>
        <span 
          class="legend" 
          style=${{'background-color': this.props.color }}>
        </span>
        <span class="label">${this.props.label}</span>
      </li>
    `;

    this.props.container.appendChild(this.node);
  }

  update() {
    this.refs.valueNode.textContent = this.state.value;
  }
}

Object.assign(Label.prototype, Template);

export default Label;
