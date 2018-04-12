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
      knobOverflow: 3,
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
      height: this.props.size,
      'pointer-events': 'none',
      style: `padding: ${this.props.knobOverflow + 1}px`
    });

    const mask = createSVGDOMElement('mask', { id: uid });

    const maskOuterCircke = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.props.radius,
      fill: 'white'
    });

    const maskInnerCircle = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.props.radius - this.props.strokeWidth,
      fill: 'black'
    });

    const knob = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.knobRadius,
      r: this.props.knobRadius + this.props.knobOverflow,
      stroke: 'black',
      fill: 'white',
      'pointer-events': 'all'
    });

    const clickLayer = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.props.trueRadius,
      'stroke-width': 50,
      stroke: 'transparent',
      fill: 'none',
      'pointer-events': 'stroke'
    });

    const rect = createSVGDOMElement('rect', {
      x: 0,
      y: 0,
      width: this.props.size + 6,
      height: this.props.size + 6,
      fill: '#babdc1',
      mask: `url(#${uid})`
    });

    const arc = createSVGDOMElement('path', {
      stroke: this.props.color,
      opacity: 0.7,
      fill: 'none',
      'stroke-width': this.props.strokeWidth 
    });

    const group = createSVGDOMElement('g');

    mask.appendChild(maskOuterCircke);
    mask.appendChild(maskInnerCircle);

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
    };

    svg.appendChild(mask);
    svg.appendChild(rect)
    svg.appendChild(arc);
    svg.appendChild(group);
    group.appendChild(clickLayer);
    group.appendChild(knob);
    
    this.refs = { svg, knob, arc, clickLayer, group };

    this.props.container.appendChild(svg);
  }

  _initTouchActions() {
    const handleTouch = (e) => {
      this._handleTouch(e.clientX, e.clientY);
    };

    const handleMouseUp = (e) => {
      // Need to handle the 'click' onto the knob. 
      if (e.target === this.refs.knob) {
        handleTouch(e);
      }
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleTouch);
    };

    const handleMouseDown = (e) => {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleTouch);
    };

    this.refs.knob.addEventListener('mousedown', handleMouseDown);
    this.refs.clickLayer.addEventListener('click', handleTouch);
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
}