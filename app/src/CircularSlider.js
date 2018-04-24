import {
  createSVGDOMElement,
  describeSVGArcPath,
  polarToCartesian,
  degreesToRadians,
  radiansToDegrees,
  getGUID,
  range
} from './helpers';
import Component from './Component';

export default class CircularSlider extends Component {
  constructor(options) {
    super();
    
    this.BASE_SLIDER_WIDTH = 45;
    this.BASE_KNOB_OVERFLOW = 6;
    this.BASE_SLIDER_RADIUS = 400;
    this.BASE_KNOB_STROKE = 2;
    
    // TODO: do something about normalization
    // TODO: check if rounding causes canvas's offset
    // TODO: what about multiple touch fingers?
    // TODO: maybe attach listeners only on the knob?
    // TODO: move some of the values into render()
    this.size = this.BASE_SLIDER_RADIUS * 2;
    this.outerRadius = this.BASE_SLIDER_RADIUS - (this.BASE_KNOB_OVERFLOW / options.percent);
    this.innerRadius = this.outerRadius - (this.BASE_SLIDER_WIDTH / options.percent);
    this.trueRadius = this.outerRadius - (this.outerRadius - this.innerRadius) / 2;
    this.sliderWidth = this.BASE_SLIDER_WIDTH / options.percent;
    this.knobYOffset = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / options.percent;
    this.knobStroke = this.BASE_KNOB_STROKE / options.percent;
    this.knobRadius = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / options.percent - this.knobStroke;
    // TODO: what if the numOfSteps is not an integer?
    this.numOfSteps = (options.max - options.min) / options.step;
    this.stepAngle = 360 / this.numOfSteps;
    this.ticking = false;
    this.latestPointerPos = null;
    this.state = {
      angle: 0
    };
    this.dimensions = null;
    
    this.props = Object.assign({}, options);

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);
    this.updateSlider = this.updateSlider.bind(this);
    this.updateLayout = this.updateLayout.bind(this);

    this.init();
  }

  init() {
    this.createSliderSVG();
    this.registerGestureEvents();
    this.registerContainerObserver();
  }

  registerContainerObserver() {
    window.addEventListener('resize', this.updateLayout);
  }

  updateLayout() {
    const { width, height } = this.props.container.getBoundingClientRect();

    this.dimensions = Math.min(width, height) * this.props.percent;

    const left = (width - this.dimensions) / 2;
    const top = (height - this.dimensions) / 2;
    
    Object.assign(this.refs.wrapper.style, {
      width: `${this.dimensions}px`,
      height: `${this.dimensions}px`,
      top: `${top}px`,
      left: `${left}px`
    });
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

    const wrapperStyle = {
      position: 'absolute',
      pointerEvents: 'none',
      overflow: 'hidden'
    };

    const baseChildStyle = {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0
    };

    const knobSvgStyle = Object.assign({}, baseChildStyle, {
      transform: `rotate(${this.state.angle}deg) translateZ(0)`
    });
    
    this.template`
      <div 
        ref="wrapper" 
        style=${wrapperStyle}>
        <svg 
          style=${baseChildStyle} 
          viewbox="0 0 ${this.size} ${this.size}" 
          preserveAspectRatio="xMidYMid meet">
          <defs>
          <mask id="${uid}">
            <circle 
              cx="${this.BASE_SLIDER_RADIUS}" 
              cy="${this.BASE_SLIDER_RADIUS}" 
              r="${this.outerRadius}" 
              fill="white">
            </circle>
            <circle 
              cx="${this.BASE_SLIDER_RADIUS}" 
              cy="${this.BASE_SLIDER_RADIUS}" 
              r="${this.innerRadius}" 
              fill="black">
            </circle>
            ${this.generateSVGMaskLines()}
          </mask>
        </defs>
          <rect 
            x="0" 
            y="0" 
            width="${this.size}" 
            height="${this.size}" 
            fill="#babdc1" 
            mask="url(#${uid})">
          </rect>
        </svg>
        <canvas 
          width="${this.size}" 
          height="${this.size }" 
          ref=${canvas => {
            this.refs.canvas = canvas;
            this.refs.ctx = canvas.getContext('2d');
          }}
          style=${baseChildStyle}>
        </canvas>
        <svg ref="svg" 
          style=${knobSvgStyle} 
          viewbox="0 0 ${this.size} ${this.size}" 
          preserveAspectRatio="xMidYMid meet">
          <g ref="group">
            <circle 
              ref="clickLayer"
              cx="${this.BASE_SLIDER_RADIUS}" 
              cy="${this.BASE_SLIDER_RADIUS}" 
              r="${this.trueRadius}" 
              stroke-width="${this.sliderWidth}" 
              stroke="transparent" 
              fill="none" 
              pointer-events="stroke">
            </circle>
            <circle
              ref="knob"
              cx="${this.BASE_SLIDER_RADIUS}" 
              cy="${this.knobYOffset}" 
              r="${this.knobRadius}" 
              stroke="black"
              stroke-width="${this.knobStroke}"
              fill="white" 
              pointer-events="all">
            </circle>
          </g>
        </svg>
      </div>
    `;

    this.updateLayout();
    this.props.container.appendChild(this.node);
  }

  generateSVGMaskLines() {
    return range(this.numOfSteps).map((i) => {
      const stepPoint = polarToCartesian(
        this.BASE_SLIDER_RADIUS,
        this.BASE_SLIDER_RADIUS,
        this.outerRadius,
        degreesToRadians(i * this.stepAngle - 90)
      );

      return `
        <line 
          x1="${this.BASE_SLIDER_RADIUS}"
          y1="${this.BASE_SLIDER_RADIUS}"
          x2="${stepPoint.x}"
          y2="${stepPoint.y}"
          stroke="black" 
          stroke-width="${4 / this.props.percent}">
        </line>
      `;
    }).join('');
  }

  get value() {
    // We need to round, beacuse in cases, when 360 is not perfectly divisible
    // by the number of steps
    return (
      Math.round(this.state.angle / this.stepAngle) * this.props.step +
      this.props.min
    );
  }

  registerGestureEvents() {
    this.refs.group.addEventListener('touchstart', this.handleGestureStart, true);
    this.refs.group.addEventListener('touchmove', this.handleGestureMove, true);
    this.refs.group.addEventListener('touchend', this.handleGestureEnd, true);
    this.refs.group.addEventListener('touchcancel', this.handleGestureEnd, true);

    this.refs.group.addEventListener('mousedown', this.handleGestureStart, true);
  }

  handleGestureStart(evt) {
    evt.preventDefault();

    this.latestPointerPos = this.getGesturePointFromEvent(evt);

    document.addEventListener('mousemove', this.handleGestureMove, true);
    document.addEventListener('mouseup', this.handleGestureEnd, true);
  }

  handleGestureMove(evt) {
    evt.preventDefault();

    this.latestPointerPos = this.getGesturePointFromEvent(evt);
    this.requestTick();
  }

  handleGestureEnd(evt) {
    evt.preventDefault();

    document.removeEventListener('mousemove', this.handleGestureMove, true);
    document.removeEventListener('mouseup', this.handleGestureEnd, true);
    
    // Change the slider if we tap/click on it
    if (evt.target === this.refs.knob || evt.target === this.refs.clickLayer) {
      this.requestTick();
    }
  }

  getGesturePointFromEvent(evt) {
    const point = {};

    if (evt.targetTouches) {
      point.x = evt.targetTouches[0].clientX;
      point.y = evt.targetTouches[0].clientY;
    } else {
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

    this.refs.svg.style.transform = `rotate(${this.state.angle}deg) translateZ(0)`;

    this.refs.ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
    this.refs.ctx.beginPath();
    this.refs.ctx.arc(
      this.BASE_SLIDER_RADIUS, 
      this.BASE_SLIDER_RADIUS, 
      this.trueRadius,
      degreesToRadians(-90), 
      degreesToRadians(this.state.angle - 90), 
      false);
    this.refs.ctx.strokeStyle = this.props.color;
    this.refs.ctx.lineWidth = this.sliderWidth;
    this.refs.ctx.globalAlpha = 0.7;
    this.refs.ctx.stroke();

    this.emit('value-changed', this.value);
  }

  calcAngleFromPoint(point) {
    const { top, left } = this.refs.wrapper.getBoundingClientRect();
    // NOTE: The first param is Y and the second is X !!!
    const angleInRadians = Math.atan2(
      point.y - (this.dimensions / 2 + top),
      point.x - (this.dimensions / 2 + left)
    );
    // Normalize the grid so that 0 deg is at 12 o'clock and it goes in clock's
    // direction.      
    const angleInDegrees = (radiansToDegrees(angleInRadians) + 450) % 360;

    return angleInDegrees;
  }
}
