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
    this.STROKE_WIDTH = 45;
    this.KNOB_OVERFLOW = 2;
    this.trueRadius = options.radius - this.STROKE_WIDTH / 2;
    this.numOfSteps = (options.max - options.min) / options.step;
    this.stepAngle = 360 / this.numOfSteps;
    this.props = Object.assign({}, options);
    this.ticking = false;
    this.latestPointerPos = null;
    this.state = {
      angle: 0
    };

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);
    this.updateSlider = this.updateSlider.bind(this);

    this.init();
  }

  init() {
    this.createSliderSVG();
    this.registerPointerEvents();
  }

  requestTick() {
    if (!this.ticking) {
      requestAnimationFrame(this.updateSlider);
    }
    this.ticking = true;
  }

  createSliderSVG() {
    // Need to reference each mask with unique `id` to avoid collisions.
    const uid = getGUID();
    const size = this.props.radius * 2;
    const knobRadius = this.STROKE_WIDTH / 2 + this.KNOB_OVERFLOW;

    const svg = createSVGDOMElement('svg', {
      width: size,
      height: size,
      'pointer-events': 'none',
      style: `padding: ${this.KNOB_OVERFLOW + 1}px`
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
      r: this.props.radius - this.STROKE_WIDTH,
      fill: 'black'
    });

    const knob = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: knobRadius,
      r: knobRadius + this.KNOB_OVERFLOW,
      stroke: 'black',
      fill: 'white',
      'pointer-events': 'all'
    });

    const clickLayer = createSVGDOMElement('circle', {
      cx: this.props.radius,
      cy: this.props.radius,
      r: this.trueRadius,
      'stroke-width': 50,
      stroke: 'transparent',
      fill: 'none',
      'pointer-events': 'stroke'
    });

    const rect = createSVGDOMElement('rect', {
      x: 0,
      y: 0,
      width: size + 6,
      height: size + 6,
      fill: '#babdc1',
      mask: `url(#${uid})`
    });

    const arc = createSVGDOMElement('path', {
      stroke: this.props.color,
      opacity: 0.7,
      fill: 'none',
      'stroke-width': this.STROKE_WIDTH 
    });

    const group = createSVGDOMElement('g');

    mask.appendChild(maskOuterCircke);
    mask.appendChild(maskInnerCircle);

    for (let i = 0; i < this.numOfSteps; i++) {
      const step = polarToCartesian(
        this.props.radius,
        this.props.radius,
        this.props.radius,
        degreesToRadians(i * this.stepAngle - 90)
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

  registerPointerEvents() {
    // TODO: remove
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

  handleGestureStart(evt) {
    evt.preventDefault();

    this.latestPointerPos = this.getGesturePointFromEvent(evt);

    if (window.PointerEvent) {
      evt.target.setPointerCapture(evt.pointerId);
    } else {
      document.addEventListener('mousemove', this.handleGestureMove, true);
      document.addEventListener('mouseup', this.handleGestureEnd, true);
    }
  }

  handleGestureMove(evt) {
    evt.preventDefault();

    this.latestPointerPos = this.getGesturePointFromEvent(evt);
    this.requestTick();
  }

  handleGestureEnd(evt) {
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
    this.ticking = false;

    const angle = this.calcAngleFromPoint(this.latestPointerPos);
    const nearestStepAngle = this.stepAngle * Math.round(angle / this.stepAngle);
    
    // Avoid unnecessary updates
    if (nearestStepAngle === this.state.angle) {
      return;
    }

    this.state.angle = nearestStepAngle;

    const pointOnCircle = polarToCartesian(
      this.props.radius,
      this.props.radius,
      this.trueRadius,
      degreesToRadians(this.state.angle - 90)
    );

    this.refs.knob.setAttributeNS(null, 'cx', pointOnCircle.x);
    this.refs.knob.setAttributeNS(null, 'cy', pointOnCircle.y);
    this.refs.arc.setAttributeNS(null, 'd', describeSVGArcPath(
      this.props.radius,
      this.props.radius,
      this.trueRadius,
      0,
      this.state.angle
    ));
  }

  calcAngleFromPoint(point) {
    const { top, left } = this.refs.svg.getBoundingClientRect();
    // NOTE: The first param is y and the second is x.
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