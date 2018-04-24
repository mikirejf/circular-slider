import { generateCSSTextString } from './helpers';

export default class Template {
  constructor() {
    this.refs = {};
  }

  template() {
    const [strings, ...vals] = arguments;
    const { refMap, DOMString } = this.parseTemplate(strings, vals);
    const dummyNode = document.createElement('div');

    // Probably safer to use DOMParser (because svg), but this is KISS
    dummyNode.innerHTML = DOMString;

    // Map referenced elements or invoke their "ref" function
    [...dummyNode.querySelectorAll('[data-ref-id]')].forEach((element) => {
      const refId = element.dataset.refId.charAt(1);
      const ref = refMap[refId];

      if (typeof ref === 'string') {
        this.refs[ref] = element;
      } else {
        ref.call(this, element);
      }

      element.removeAttribute('data-ref-id');
    });

    this.node = dummyNode.firstElementChild;
  }

  parseTemplate(strings, vals) {
    const visitors = [
      { // e.g. ` ref="canvas"`
        matcher: /\sref="\w{1,}\"/g,
        action: (match, value, state) => {
          state.replacement = ` data-ref-id="_${state.refId}"`;
          state.refMap[state.refId] = match.substring(' ref="'.length, match.length - 1);
          state.refId += 1;
        }
      },
      { // e.g. ` ref=${ canvas => { this.refs.ctx = canvas.getContext('2d); }}`
        matcher: /\sref=/,
        action: (match, value, state) => {
          state.replacement = ` data-ref-id="_${state.refId}"`;
          state.refMap[state.refId] = value;
          state.refId += 1;
          state.valueConsumed = true;
        }
      },
      { // e.g. ` style=${{ color: 'blue' }}`
        matcher: /\sstyle\=/,
        action: (match, value, state) => {
          state.replacement = ` style="${generateCSSTextString(value)}"`;
          state.valueConsumed = true;
        }
      }
    ];

    const state = {
      valueConsumed: false,
      refId: 0,
      refMap: {},
      replacement: ''
    };
   
    const DOMStringArr = strings.reduce((DOMStringArr, string, i) => {
      let newString = string;
      let valueConsumed = false;

      // Passing the string through each visitor and applying transformations if 
      // necessary
      visitors.forEach((visitor) => {
        newString = newString.replace(visitor.matcher, (match) => {
          visitor.action(match, vals[i], state);
          
          return state.replacement;
        })
      });

      if (!state.valueConsumed) {
        newString = `${newString}${vals[i]}`;
      }
      
      state.valueConsumed = false;
      
      return [...DOMStringArr, newString];
    }, []);

    return {
      refMap: state.refMap,
      DOMString: DOMStringArr.join('').trim()
    };
  }
}
