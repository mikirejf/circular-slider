import {
  createSVGDOMElement,
  describeSVGArcPath,
  polarToCartesian,
  degreesToRadians,
  radiansToDegrees,
  getGUID,
  range,
  bindOnRAF
} from './helpers';
import Component from './Component';

// TODO: do something about normalization
// TODO: check if rounding causes canvas's offset
// TODO: what about multiple touch fingers?
// TODO: maybe attach listeners only on the knob?
// TODO: move some of the values into render()
export default class CircularSlider extends Component {
  constructor(options) {
    super();

    this.BASE_SLIDER_RADIUS = 400;
    this.BASE_SLIDER_WIDTH = 45;
    this.BASE_DASH_STROKE = 4;
    this.BASE_KNOB_OVERFLOW = 8;
    this.BASE_KNOB_STROKE = 3;

    this.numOfSteps = (options.max - options.min) / options.step;
    this.stepAngle = 360 / this.numOfSteps;
    this.size = this.BASE_SLIDER_RADIUS * 2;
    this.outerRadius = this.BASE_SLIDER_RADIUS - (this.BASE_KNOB_OVERFLOW / options.radius);
    this.innerRadius = this.outerRadius - (this.BASE_SLIDER_WIDTH / options.radius);
    this.middleRadius = this.outerRadius - (this.outerRadius - this.innerRadius) / 2;
    this.sliderWidth = this.BASE_SLIDER_WIDTH / options.radius;
    this.knobYOffset = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / options.radius;
    this.knobStroke = this.BASE_KNOB_STROKE / options.radius;
    this.knobRadius = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / options.radius - this.knobStroke;
    
    this.latestPointerPos = null;
    this.state = {
      angle: 0
    };
    this.wrapperSideDim = null;
    
    this.props = Object.assign({}, options);

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);
    this.updateSlider = bindOnRAF.call(this, this.updateSlider);
    this.updateLayout = bindOnRAF.call(this, this.updateLayout);

    this.init();
  }

  get value() {
    // We need to round, beacuse in some cases, 360 is not perfectly divisible
    // by the number of steps
    return (
      Math.round(this.state.angle / this.stepAngle) * this.props.step +
      this.props.min
    );
  }

  init() {
    this.render();
    this.registerGestureEvents();
    this.registerContainerObserver();
  }

  registerGestureEvents() {
    this.refs.clickLayer.addEventListener('touchstart', this.handleGestureStart, true);
    this.refs.clickLayer.addEventListener('touchmove', this.handleGestureMove, true);
    this.refs.clickLayer.addEventListener('touchend', this.handleGestureEnd, true);
    this.refs.clickLayer.addEventListener('touchcancel', this.handleGestureEnd, true);

    this.refs.clickLayer.addEventListener('mousedown', this.handleGestureStart);
  }

  registerContainerObserver() {
    window.addEventListener('resize', this.updateLayout);
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
    this.updateSlider();
  }

  handleGestureEnd(evt) {
    evt.preventDefault();

    document.removeEventListener('mousemove', this.handleGestureMove, true);
    document.removeEventListener('mouseup', this.handleGestureEnd, true);
    
    // Change the slider if we tap/click on it
    if (evt.target === this.refs.knob || evt.target === this.refs.circleLayer) {
      this.updateSlider();
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

  calcAngleFromPoint(point) {
    const { top, left } = this.refs.wrapper.getBoundingClientRect();
    // NOTE: The first param is Y and the second is X !!!
    const angleInRadians = Math.atan2(
      point.y - (this.wrapperSideDim / 2 + top),
      point.x - (this.wrapperSideDim / 2 + left)
    );
    // Normalizes the grid so that 0 deg is at 12 o'clock and it goes in clock's
    // direction.      
    const angleInDegrees = (radiansToDegrees(angleInRadians) + 450) % 360;

    return angleInDegrees;
  }

  render() {
    // Need to reference each mask with unique id to avoid collisions.
    // We could also generate `uid` from the props, that define the mask. E.g. 
    // `${max - min}${step}{percent * 100}`. If we init two sliders, with the 
    // same "base" props, the second could reference the mask from the first
    // one. That solution doesn't allow removing the sliders from the DOM (the 
    // second slider would lost the reference to the mask, if the first one
    // doesn't exist anymore).
    // We could also just simply draw the mask into a canvas
    // (image quality concerns).
    // Maybe there is also a solution using base64, but I couldn't get it
    // working yet.
    const maskUid = `_mask-${getGUID()}${this.props.color}`;
    const gradientUid = `_knob-${getGUID()}${this.props.color}`;
    const wrapperStyle = {
      position: 'absolute',
      pointerEvents: 'none',
      overflow: 'hidden',
      'user-select': 'none',
      '-moz-user-select': 'none',
      '-ms-user-select': 'none',
      '-webkit-user-select': 'none',
      '-webkit-tap-highlight-color': 'transparent'
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
    
    const initCanvas = (canvas) => {
      this.refs.canvas = canvas;
      this.refs.ctx = canvas.getContext('2d');
      this.refs.ctx.strokeStyle = this.props.color;
      this.refs.ctx.lineWidth = this.sliderWidth;
      this.refs.ctx.globalAlpha = 0.8;
    };

    const generateSVGMaskLines = () => {
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
            stroke-width="${this.BASE_DASH_STROKE / this.props.radius}">
          </line>
        `;
      }).join('');
    };
    
    this.template`
      <div 
        ref="wrapper" 
        style=${wrapperStyle}>

        <svg 
          style=${baseChildStyle} 
          viewbox="0 0 ${this.size} ${this.size}" 
          preserveAspectRatio="xMidYMid meet">
          <defs>
          <mask id="${maskUid}">
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
            ${generateSVGMaskLines()}
          </mask>
        </defs>
          <rect 
            x="0" 
            y="0" 
            width="${this.size}" 
            height="${this.size}" 
            fill="#babdc1" 
            mask="url(#${maskUid})">
          </rect>
        </svg>

        <canvas 
          width="${this.size}" 
          height="${this.size }" 
          ref=${initCanvas}
          style=${baseChildStyle}>
        </canvas>

        <svg 
          ref="knobSvg" 
          style=${knobSvgStyle} 
          viewbox="0 0 ${this.size} ${this.size}" 
          preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="${gradientUid}" r="80%">
              <stop offset="15%" stop-color="#fff" stop-opacity="1"></stop>
              <stop offset="70%" stop-color="#eff0f0" stop-opacity="1"></stop>
            </radialGradient>
          </defs>
          <g ref="clickLayer">
            <circle 
              ref="circleLayer"
              cx="${this.BASE_SLIDER_RADIUS}" 
              cy="${this.BASE_SLIDER_RADIUS}" 
              r="${this.middleRadius}" 
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
              stroke="#b7b8b8"
              stroke-width="${this.knobStroke}"
              fill="url(#${gradientUid})" 
              pointer-events="all">
            </circle>
          </g>
        </svg>

      </div>
    `;

    this.updateLayout();
    this.props.container.appendChild(this.node);
  }

  updateSlider() {
    const angle = this.calcAngleFromPoint(this.latestPointerPos);
    const nearestStepAngle = this.stepAngle * Math.round(angle / this.stepAngle);
    
    // Avoid unnecessary updates
    if (nearestStepAngle === this.state.angle) {
      return;
    }

    this.state.angle = nearestStepAngle;

    this.refs.knobSvg.style.transform = `rotate(${this.state.angle}deg) translateZ(0)`;

    this.refs.ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
    this.refs.ctx.beginPath();
    this.refs.ctx.arc(
      this.BASE_SLIDER_RADIUS, 
      this.BASE_SLIDER_RADIUS, 
      this.middleRadius,
      degreesToRadians(-90), 
      degreesToRadians(this.state.angle - 90), 
      false);
    this.refs.ctx.stroke();

    this.emit('value-changed', this.value);
  }

  updateLayout() {
    const { width, height } = this.props.container.getBoundingClientRect();

    this.wrapperSideDim = Math.min(width, height) * this.props.radius;

    const left = (width - this.wrapperSideDim) / 2;
    const top = (height - this.wrapperSideDim) / 2;
    
    Object.assign(this.refs.wrapper.style, {
      width: `${this.wrapperSideDim}px`,
      height: `${this.wrapperSideDim}px`,
      top: `${top}px`,
      left: `${left}px`
    });
  }
}
