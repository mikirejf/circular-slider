export default class Template {
  constructor() {
    this.refMap = {};
    this.refs = {};
  }

  template() {
    const [strings, ...vals] = arguments;
    const dummyNode = document.createElement('div');
    const DOMString = this.parseTemplate(strings, vals);

    // Probably safer to use DOMParser (because svg)
    dummyNode.innerHTML = DOMString;

    [...dummyNode.querySelectorAll('[data-ref-id]')].forEach((element) => {
      const refIdNum = element.dataset.refId.charAt(1);
      const ref = this.refMap[refIdNum];

      if (typeof ref === 'string') {
        this.refs[ref] = element;
      } else {
        ref.call(this, element);
      }

      element.removeAttribute('data-ref-id');
    });

    this.node = dummyNode.firstChild;
  }

  parseTemplate(strings, vals) {
    const stringRefRegex = /\sref="\w{1,}\"/g;
    const funcRefRegex = /\sref=/;
    const styleRegex = /\sstyle\=/;
    const DOMString = [];
    let refIdCounter = 0;

    for (let i = 0, len = strings.length; i < len; i++) {
      let string = strings[i];
      let valueConsumed = false;

      // Parse ref string
      string = string.replace(stringRefRegex, match => {
        const refId = ` data-ref-id="_${refIdCounter}"`;

        this.refMap[refIdCounter] = match.substring(
          ' ref="'.length,
          match.length - 1
        );
        refIdCounter += 1;

        return refId;
      });

      // Parse ref function
      string = string.replace(funcRefRegex, match => {
        const refId = ` data-ref-id="_${refIdCounter}"`;

        this.refMap[refIdCounter] = vals[i];
        refIdCounter += 1;
        valueConsumed = true;

        return refId;
      });

      // Generate inline style
      string = string.replace(styleRegex, match => {
        valueConsumed = true;
        return ` style="${this.generateCSSText(vals[i])}"`;
      });

      if (!valueConsumed) {
        string = `${string}${vals[i]}`;
      }

      DOMString.push(string);
    }

    return DOMString.join('').trim();
  }

  generateCSSText(style) {
    return Object.keys(style)
      .map(prop => {
        return `${prop}:${style[prop]};`;
      })
      .join('');
  }
}