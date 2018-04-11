export function createSVGDOMElement(shape, attributes = {}) {
  const svgDOM = document.createElementNS('http://www.w3.org/2000/svg', shape);

  for (let prop in attributes) {
    svgDOM.setAttributeNS(null, prop, attributes[prop]);
  }

  return svgDOM;
}

export function polarToCartesian(centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export function radiansToDegrees(angleInRadians) {
  return angleInRadians * 180 / Math.PI;
}

export function degreesToRadians(angleInDegrees) {
  return angleInDegrees / 180 * Math.PI;
}

export function getGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function describeSVGArcPath(x, y, radius, startAngle, endAngle) {
  // TODO: do something about grid normalization
  // There is a problem with drawing a full 360deg arc, because we are drawing
  // the arc from "itself" to "itself" (?). To correct that, we are 
  // subtracting `0.00001` (can't go lower) from `endAngle`, so we never have 
  // a full 360 value.
  const start = polarToCartesian(x, y, radius, degreesToRadians(endAngle - 90.00001));
  const end = polarToCartesian(x, y, radius, degreesToRadians(startAngle - 90));
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
      'M', start.x, start.y, 
      'A', radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(' ');

  return d;
}