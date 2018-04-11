import {
  createSVGDOMElement,
  describeSVGArcPath,
  polarToCartesian,
  degreesToRadians,
  radiansToDegrees,
  getGUID
} from './helpers';

export default class CircularSlider {
  constructor(options) {
    const strokeWidth = 50;
    const numOfSteps = (options.max - options.min) / options.step;
    const stepAngle = 360 / numOfSteps;

    this.props = Object.assign({}, options, {
      size: 2 * options.radius,
      trueRadius: options.radius - strokeWidth / 2,
      knobRadius: strokeWidth / 2,
      strokeWidth,
      numOfSteps,
      stepAngle
    });

    this.state = {
      angle: 0
    };

    this._init();
  }

  _init() {
    this._createSliderSVG();
    this._initTouchActions();
  }

  _createSliderSVG() {
    // Need to reference each mask with unique `id` to avoid collisions.
    const uid = getGUID();
    const svg = createSVGDOMElement('svg', {
      width: this.props.size,
      height: this.props.size
    });
    const mask = createSVGDOMElement('mask', { id: uid });
    const maskRect = createSVGDOMElement('rect', {
      x: 0,
      y: 0,
      width: this.props.size,
      height: this.props.size,
      fill: 'white'
    });
    const knob = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.knobRadius,
      r: this.props.knobRadius,
      stroke: 'black',
      fill: 'white'
    });
    const circle = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.props.trueRadius,
      stroke: '#babdc1',
      'stroke-width': this.props.strokeWidth,
      fill: 'none',
      mask: `url(#${uid})`
    });
    const arc = createSVGDOMElement('path', {
      stroke: this.props.color,
      opacity: 0.7,
      fill: 'none',
      'stroke-width': this.props.strokeWidth 
    });
    const group = createSVGDOMElement('g');

    mask.appendChild(maskRect);

    for (let i = 0; i < this.props.numOfSteps; i++) {
      const step = polarToCartesian(
        this.props.radius,
        this.props.radius,
        this.props.radius,
        degreesToRadians(i * this.props.stepAngle - 90)
      );
      
      mask.appendChild(createSVGDOMElement('line', {
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

  _initTouchActions() {
    document.addEventListener('touchmove', (e) => {
      this._handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    });
    document.addEventListener('mousemove', (e) => {
      this._handleTouch(e.clientX, e.clientY);
    });
  }

  _handleTouch(x, y) {
    const angle = this._calcAngleFromPoint(x, y);
    const nearestStepAngle = this.props.stepAngle * Math.round(angle / this.props.stepAngle);
    
    if (nearestStepAngle !== this.state.angle) {
      this.state.angle = nearestStepAngle;
      this._updateSlider()
    }
  }

  _updateSlider() {
    const pointOnCircle = polarToCartesian(
      this.props.radius,
      this.props.radius,
      this.props.trueRadius,
      degreesToRadians(this.state.angle - 90)
    );

    this.refs.knob.setAttributeNS(null, 'cx', pointOnCircle.x);
    this.refs.knob.setAttributeNS(null, 'cy', pointOnCircle.y);
    this.refs.arc.setAttributeNS(null, 'd', describeSVGArcPath(
      this.props.radius,
      this.props.radius,
      this.props.trueRadius,
      0,
      this.state.angle
    ));
  }

  _calcAngleFromPoint(x, y) {
    const { top, left } = this.refs.svg.getBoundingClientRect();
    // TODO: !!!! first Y then X !!!!
    const angleInRadians = Math.atan2(
      y - (this.props.radius + top),
      x - (this.props.radius + left)
    );
    // TODO: do something about normalization
    // Normalize the grid so that 0 deg is at 12 o'clock and it goes in clock's
    // direction.      
    const angleInDegrees = (radiansToDegrees(angleInRadians) + 450) % 360;

    return angleInDegrees;
  }

  _getNearestStepAngle() {

  }
}