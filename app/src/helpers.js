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

export function generateCSSTextString(styleObj) {
  const upperToHyphenLower = (match, offset) => {
    return `${offset > 0 ? '-' : ''}${match.toLowerCase()}`;
  };

  return Object.keys(styleObj)
    .map((prop) => {
      const stylePropName = prop.replace(/[A-Z]/g, upperToHyphenLower);

      return `${stylePropName}:${styleObj[prop]};`;
    })
    .join('');
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
