import Component from './Component';

export default class Label extends Component {
  constructor(props) {
    super();

    this.props = props;
    this.state = {
      value: ''
    };

    this.render();
  }

  set value (value) {
    this.setState({ value: value });
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
    // TODO: check textContent layouts
    this.refs.valueNode.textContent = this.state.value;
  }
}