export default class CircularSlider {
  constructor(options) {
    const strokeWidth = 50;

    this.props = Object.assign({}, options, {
      strokeWidth,
      size: 2 * options.radius,
      trueRadius: options.radius - strokeWidth / 2,
      knobRadius: strokeWidth / 2
    });

    this._init();
  }

  _init() {
    this._createSliderSVG();
  }

  _createSliderSVG() {
    // Need to reference each mask with unique `id` to avoid collisions.
    const uid = this._getGUID();
    const svg = this._createSVGDOMElement('svg', {
      width: this.props.size, height: this.props.size 
    });
    const mask = this._createSVGDOMElement('mask', { id: uid });
    const maskRect = this._createSVGDOMElement('rect', {
      x: 0,
      y: 0,
      width: this.props.size,
      height: this.props.size,
      fill: 'white'
    });
    const knob = this._createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.knobRadius,
      r: this.props.knobRadius,
      stroke: 'black',
      fill: 'white'
    });
    const circle = this._createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.props.trueRadius,
      stroke: '#babdc1',
      'stroke-width': this.props.strokeWidth,
      fill: 'none',
      mask: `url(#${uid})`
    });
    const arc = this._createSVGDOMElement('path', {
      stroke: this.props.color,
      opacity: 0.7,
      fill: 'none',
      'stroke-width': this.props.strokeWidth 
    });
    const group = this._createSVGDOMElement('g');
    const numOfSteps = (this.props.max - this.props.min) / this.props.step;
    const stepAngle = 360 / numOfSteps;

    mask.appendChild(maskRect);

    for (let i = 0; i < numOfSteps; i++) {
      const step = this._polarToCartesian(
        this.props.radius,
        this.props.radius,
        this.props.radius,
        i * stepAngle
      );
      
      mask.appendChild(this._createSVGDOMElement('line', {
        x1: this.props.radius,
        x2: step.x,
        y1: this.props.radius,
        y2: step.y,
        stroke: 'black',
        'stroke-width': 4
      }));
    }

    group.appendChild(circle);
    group.appendChild(arc);

    svg.appendChild(mask);
    svg.appendChild(group);
    svg.appendChild(knob); 

    this.refs = { svg, knob, arc };

    this.props.container.appendChild(svg);
  }

  _getGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  _createSVGDOMElement(shape, attributes = {}) {
    const svgDOM = document.createElementNS('http://www.w3.org/2000/svg', shape);

    for (let prop in attributes) {
      svgDOM.setAttributeNS(null, prop, attributes[prop]);
    }

    return svgDOM;
  }

  _polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    // We normalize the polar grid so that 0 deg points at 12 o'clock.
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  _createArcPath() {

  }

  _getNearestStepAngle() {

  }

  _getGlobalOffset() {

  }
}