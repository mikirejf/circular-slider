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
    const numOfSteps = (this.props.max - this.props.min) / this.props.step;
    const stepAngle = 360 / numOfSteps;

    mask.appendChild(maskRect);

    for (let i = 0; i < numOfSteps; i++) {
      const step = polarToCartesian(
        this.props.radius,
        this.props.radius,
        this.props.radius,
        i * degreesToRadians(stepAngle)
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
    const handleMove = (e) => {
      const angleInDegrees = this._getAngleFromEvent(e);
      const arcPath = describeSVGArcPath(
        this.props.radius,
        this.props.radius,
        this.props.trueRadius,
        0,
        angleInDegrees
      );

      this.refs.arc.setAttributeNS(null, 'd', arcPath);
    };

    document.addEventListener('touchmove', (e) => {
      handleMove({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      })
    });
    document.addEventListener('mousemove', handleMove);
  }

  _getAngleFromEvent(e) {
    const { top, left } = this.refs.svg.getBoundingClientRect();
    const angleInRadians = Math.atan2(
      e.clientY - (this.props.radius + top),
      e.clientX - (this.props.radius + left)
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