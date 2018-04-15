class Label {
  constructor(props) {
    this.props = props;
    this.val = '';
  }

  set value (val) {
    this.val = val;
    // TODO: check textContent performance
    this.refs.value.textContent = val;
  }

  get value () {
    return this.val;
  }

  render() {
    const element = document.createElement('div');
    const value = document.createElement('span');
    const color = document.createElement('span');
    const label = document.createElement('span');

    element.appendChild(value);
    element.appendChild(color);
    element.appendChild(label);

    this.props.container.appendChild(element);
  }
}