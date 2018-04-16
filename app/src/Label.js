export default class Label {
  constructor(props) {
    this.props = props;
    this.val = '';
    this.styles = null;

    this.defineStyles();
    this.render();
  }

  set value (val) {
    this.val = val;
    // TODO: check textContent performance
    this.refs.value.textContent = val;
  }

  get value () {
    return this.val;
  }

  defineStyles() {
    const lighterColor = (this.props.color & 0x7f7f7f) << 1;

    this.styles = {
      element: {
        width: '400px',
        'display': 'flex'
      },
      value: {
        width: '100px',
        'font-family': 'sans-serif',
        'font-size': '45px'
      },
      colorLabel: {
        background: `linear-gradient(${lighterColor}, ${this.props.color})`,
        width: '40px',
        height: '40px'
      },
      label: {
        width: '40px'
      }
    }
  }

  render() {
    const element = document.createElement('div');
    const value = document.createElement('span');
    const colorLabel = document.createElement('span');
    const label = document.createElement('span');

    label.textContent = this.props.label;
    
    Object.assign(element.style, this.styles.element);
    Object.assign(value.style, this.styles.value);
    Object.assign(colorLabel.style, this.styles.colorLabel);
    Object.assign(label.style, this.styles.label);
    
    element.appendChild(value);
    element.appendChild(colorLabel);
    element.appendChild(label);
    
    this.refs = { value };
    this.props.container.appendChild(element);
  }
}