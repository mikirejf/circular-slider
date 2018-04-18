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

    this.refs = [...dummyNode.querySelectorAll('[data-ref-id]')].reduce(
      (refs, element) => {
        const refIdNum = element.dataset.refId.charAt(1);

        element.removeAttribute('data-ref-id');
        refs[this.refMap[refIdNum]] = element;

        return refs;
      },
      {}
    );

    this.node = dummyNode.firstChild;
  }

  parseTemplate(strings, vals) {
    const stringRefRegex = /(?<=\s)ref="\w{1,}\"/;
    const styleRegex = /(?<=\s)style\=/;
    const DOMString = [];
    let refIdCounter = 0;

    for (let i = 0, len = strings.length; i < len; i++) {
      let string = strings[i];

      // Parse ref string
      string = string.replace(stringRefRegex, match => {
        const refId = `data-ref-id="_${refIdCounter}"`;

        this.refMap[refIdCounter] = match.substring(
          'ref="'.length,
          match.length - 1
        );
        refIdCounter += 1;

        return refId;
      });

      // Generate inline style
      string = string.replace(styleRegex, match => {
        return `style="${this.generateCSSText(vals[i])}"`;
      });

      if (string == strings[i]) {
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