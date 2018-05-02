import {
  polarToCartesian,
  degreesToRadians,
  radiansToDegrees,
  getGUID,
  range,
  bindOnRAF,
  getPointFromEvent,
  describeSVGArcPath
} from './helpers';
import Template from './mixins/Template';
import EventEmitter from './mixins/EventEmitter';

// TODO: do something about normalization
// TODO: check if rounding causes canvas's offset
// TODO: what about multiple touch fingers?
// TODO: maybe attach listeners only on the knob?
class CircularSlider {
  constructor(props) {
    this.BASE_SLIDER_RADIUS = 400;
    this.BASE_SLIDER_WIDTH = 45;
    this.BASE_DASH_STROKE = 4;
    this.BASE_KNOB_OVERFLOW = 10;
    this.BASE_KNOB_STROKE = 3;

    this.numOfSteps = (props.max - props.min) / props.step;
    this.stepAngle = 360 / this.numOfSteps;
    this.outerRadius = this.BASE_SLIDER_RADIUS - (this.BASE_KNOB_OVERFLOW / props.radius);
    this.innerRadius = this.outerRadius - (this.BASE_SLIDER_WIDTH / props.radius);
    this.middleRadius = this.outerRadius - (this.outerRadius - this.innerRadius) / 2;
    this.sliderWidth = this.BASE_SLIDER_WIDTH / props.radius;
    
    this.state = {
      angle: 0,
      sideDimension: null,
      latestPointerPos: null
    };
    this.props = Object.assign({}, props);

    this.handleGestureStart = this.handleGestureStart.bind(this);
    this.handleGestureMove = this.handleGestureMove.bind(this);
    this.handleGestureEnd = this.handleGestureEnd.bind(this);
    this.updateSlider = bindOnRAF.call(this, this.updateSlider);
    this.updateLayout = this.updateLayout.bind(this);

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

    this.state.latestPointerPos = getPointFromEvent(evt);

    document.addEventListener('mousemove', this.handleGestureMove, true);
    document.addEventListener('mouseup', this.handleGestureEnd, true);
  }

  handleGestureMove(evt) {
    evt.preventDefault();

    this.state.latestPointerPos = getPointFromEvent(evt);
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

  calcAngleFromPoint(point) {
    const { top, left } = this.refs.wrapper.getBoundingClientRect();
    // NOTE: The first param is Y and the second is X !!!
    const angleInRadians = Math.atan2(
      point.y - (this.state.sideDimension / 2 + top),
      point.x - (this.state.sideDimension / 2 + left)
    );
    // Normalizes the grid so that 0 deg is at 12 o'clock and it goes in clock's
    // direction.      
    const angleInDegrees = (radiansToDegrees(angleInRadians) + 450) % 360;

    return angleInDegrees;
  }

  render() {
    const dimension = this.BASE_SLIDER_RADIUS * 2;
    const knobYOffset = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / this.props.radius;
    const knobStroke = this.BASE_KNOB_STROKE / this.props.radius;
    const knobRadius = this.sliderWidth / 2 + this.BASE_KNOB_OVERFLOW / this.props.radius - knobStroke;
    // Need to reference each mask with unique id to avoid collisions.
    // We could also generate `uid` from the props that define the mask. E.g. 
    // `${max - min}${step}{percent * 100}`. If we init two sliders, with the 
    // same "base" props, the second could reference the mask from the first
    // one. That solution doesn't allow removing the sliders from the DOM (the 
    // second slider would lost the reference to the mask, if the first one
    // doesn't exist anymore).
    // We could also just simply draw the mask into a canvas
    // (image quality concerns?).
    // Maybe there is also a solution using base64, but I couldn't get it 
    // working yet.
    const uid = `${getGUID()}${this.props.color}`;
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
      transform: `rotate(${this.state.angle}deg)`,
      willChange: 'transform'
    });

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
          viewbox="0 0 ${dimension} ${dimension}" 
          preserveAspectRatio="xMidYMid meet">
          <defs>
          <mask id="_mask-${uid}">
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
            width="${dimension}" 
            height="${dimension}" 
            fill="#babdc1" 
            mask="url(#_mask-${uid})">
          </rect>
        </svg>

        <svg 
          ref="knobSvg" 
          style=${knobSvgStyle} 
          viewbox="0 0 ${dimension} ${dimension}" 
          preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="_gradient-${uid}" r="80%">
              <stop offset="15%" stop-color="#fff" stop-opacity="1"></stop>
              <stop offset="70%" stop-color="#eff0f0" stop-opacity="1"></stop>
            </radialGradient>
          </defs>
          <path
            ref="arc" 
            stroke="${this.props.color}" 
            opacity="0.7" 
            fill="none" 
            stroke-width="${this.sliderWidth}" 
            d="">
          </path>
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
              cy="${knobYOffset}" 
              r="${knobRadius}" 
              stroke="#b7b8b8"
              stroke-width="${knobStroke}"
              fill="url(#_gradient-${uid})" 
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
    const angle = this.calcAngleFromPoint(this.state.latestPointerPos);
    const nearestStepAngle = this.stepAngle * Math.round(angle / this.stepAngle);
    
    // Avoid unnecessary updates
    if (nearestStepAngle === this.state.angle) {
      return;
    }

    this.state.angle = nearestStepAngle;

    this.refs.knobSvg.style.transform = `rotate(${this.state.angle}deg)`;
    this.refs.arc.setAttributeNS(null, 'd', describeSVGArcPath(
      this.BASE_SLIDER_RADIUS,
      this.BASE_SLIDER_RADIUS,
      this.middleRadius,
      -1 * this.state.angle,
      0
    ));

    this.emit('value-changed', this.value);
  }

  updateLayout() {
    const { width, height } = this.props.container.getBoundingClientRect();
    const sideDimension = Math.round(Math.min(width, height) * this.props.radius);
    const left = (width - sideDimension) / 2;
    const top = (height - sideDimension) / 2;
    
    Object.assign(this.refs.wrapper.style, {
      width: `${sideDimension}px`,
      height: `${sideDimension}px`,
      top: `${top}px`,
      left: `${left}px`
    });

    this.state.sideDimension = sideDimension;
  }
}

Object.assign(CircularSlider.prototype, Template, EventEmitter);

export default CircularSlider;
