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
    const nodeStyle = { 
      'list-style-type': 'none', 
      'font-family': 'sans-serif',
      width: '300px',
      display: 'flex',
      'align-items': 'flex-end'
     };
    const valueStyle = {
      'font-size': '50px',
      'font-weight': 600,
      'text-align': 'right',
      flex: 1
    };
    const legendStyle = {
      'background-color': `${this.props.color}`,
      width: '20px',
      height: '13px',
      margin: '0px 15px 10px 15px'
    };
    const labelStyle = {
      'margin-bottom': '8px',
      flex: 1
    };

    this.template`
      <li style=${nodeStyle}>
        <span style=${valueStyle} ref="valueNode">${this.state.value}</span>
        <span style=${legendStyle}></span>
        <span style=${labelStyle}>${this.props.label}</span>
      </li>
    `;

    this.props.container.appendChild(this.node);
  }

  update() {
    // TODO: check textContent layouts
    this.refs.valueNode.textContent = this.state.value;
  }
}