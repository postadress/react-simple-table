import en from './en.json';
import de from './de.json';


export class i18n extends Function {
  lang: string;
  mapping: {[key: string] : string};

  constructor(lang: string) {
    super();

    const closure: any = function() {
      switch (lang) {
        case 'de':
            closure.mapping = de;
            break;
        case 'en':
            closure.mapping = en;
            break;
        default:
            closure.mapping = en;
      }
      return closure._call.apply(closure, arguments);
    }
    return Object.setPrototypeOf(closure, new.target.prototype);
  }

  _call(placeholder: string) {
     return this.mapping[placeholder];
  }
}
