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
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getPointFromEvent(evt) {
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

export function range(length) {
  return [...Array(length).keys()];
}

export function bindOnRAF(fn) {
  let ticking = false;
  let args;

  const invoke = () => {
    ticking = false;
    fn.apply(this, args)
  };

  return function () {
    args = arguments;

    if (!ticking) {
      requestAnimationFrame(invoke);
    }

    ticking = true;
  };
}

export function describeSVGArcPath(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, degreesToRadians(endAngle));
  const end = polarToCartesian(x, y, radius, degreesToRadians(startAngle));
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
      'M', start.x, start.y, 
      'A', radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(' ');

  return d;
}
