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

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);

    this.init();
  }

  init() {
    this.createSliderSVG();
    this.registerPointerEvents();
  }

  createSliderSVG() {
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

  handleGestureStart(evt) {
    evt.preventDefault();

    if (window.PointerEvent) {
      evt.target.setPointerCapture(evt.pointerId);
    } else {
      document.addEventListener('mousemove', this.handleGestureMove, true);
      document.addEventListener('mouseup', this.handleGestureEnd, true);
    }
  }

  handleGestureMove(evt) {
    evt.preventDefault();
    
    const angle = this.calcAngleFromPoint(this.getGesturePointFromEvent(evt));
    const nearestStepAngle = this.props.stepAngle * Math.round(angle / this.props.stepAngle);
    
    if (nearestStepAngle !== this.state.angle) {
      this.state.angle = nearestStepAngle;
      this.updateSlider()
    }
  }

  handleGestureEnd(evt) {
    console.log('end');

    evt.preventDefault();

    if (window.PointerEvent) {
      evt.target.releasePointerCapture(evt.pointerId);
    } else {
      document.removeEventListener('mousemove', this.handleGestureMove, true);
      document.removeEventListener('mouseup', this.handleGestureEnd, true);
    }

    // Change the slider if we tap/click on it
    if (evt.target === this.refs.knob || evt.target === this.refs.clickLayer) {
      this.handleGestureMove(evt);
    }
  }

  registerPointerEvents() {
    window.PointerEvent = false;

    // TODO: what about multiple touch fingers?
    // TODO: maybe attach listeners only on the knob?
    if (window.PointerEvent) {
      this.refs.group.addEventListener('pointerdown', this.handleGestureStart, true);
      this.refs.group.addEventListener('pointermove', this.handleGestureMove, true);
      this.refs.group.addEventListener('pointerup', this.handleGestureEnd, true);
      this.refs.group.addEventListener('pointercancel', this.handleGestureEnd, true);
    } else {
      this.refs.group.addEventListener('touchstart', this.handleGestureStart, true);
      this.refs.group.addEventListener('touchmove', this.handleGestureMove, true);
      this.refs.group.addEventListener('touchend', this.handleGestureEnd, true);
      this.refs.group.addEventListener('touchcancel', this.handleGestureEnd, true);

      this.refs.group.addEventListener('mousedown', this.handleGestureStart, true);
    }
  }

  getGesturePointFromEvent(evt) {
    const point = {};

    if (evt.targetTouches) {
      // Prefer Touch Events
      point.x = evt.targetTouches[0].clientX;
      point.y = evt.targetTouches[0].clientY;
    } else {
      // Either Mouse event or Pointer Event
      point.x = evt.clientX;
      point.y = evt.clientY;
    }

    return point;
  }

  updateSlider() {
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

  calcAngleFromPoint(point) {
    const { top, left } = this.refs.svg.getBoundingClientRect();
    // TODO: !!!! first Y then X !!!!
    const angleInRadians = Math.atan2(
      point.y - (this.props.radius + top),
      point.x - (this.props.radius + left)
    );
    // TODO: do something about normalization
    // Normalize the grid so that 0 deg is at 12 o'clock and it goes in clock's
    // direction.      
    const angleInDegrees = (radiansToDegrees(angleInRadians) + 450) % 360;

    return angleInDegrees;
  }
}