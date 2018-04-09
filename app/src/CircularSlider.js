export default class CircularSlider {
  constructor(options) {
    
  }

  _init() {
    
  }

  _createSliderSVG() {
    const baseTemplate = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${}" height="${}">
        <defs>
          <mask id="dashes">
            <rect x="0" y="0" width="${}" height="${}" fill="white"></rect>
            ${}   
          </mask>
        </defs>
        <g>
          <circle cx="${}" cy="${}" r="${}" stroke-width="${}" stroke="#bebfc0" fill="none" mask="url(#dashes)" />
          <path stroke="${}" opacity="0.7" fill="none" stroke-width="${}"></path>
        </g>
      </svg>
    `;
  }

  _createMaskLine() {

  }

  _createArcPath() {

  }

  _polarToCartesian() {

  }

  _getNearestStepAngle() {

  }

  _getGlobalOffset() {

  }
}