import {LitElement, html} from 'lit';

export class Permalink extends LitElement {
  static properties = {
    code: {type: String},
    call: {type: String},
    adaptive: {type: String},
    version: {type: String},
  };

  constructor() {
    super();
  }

  get path() {
    let pathParams = [];
    Object.keys(Permalink.properties).forEach((key) => {
      if (this[key]) {
        pathParams.push(`${key}=${encodeURIComponent(this[key])}`);
      }
    });
    return pathParams.join('&');
  }

  render() {
    if (!this.code) return;

    const url = `${window.location.origin}/?${this.path.replace(/\(/g, '%28').replace(/\)/g, '%29')}`;
    return html`
      <label for="permalink-input">Permalink:</label>
      <input type="url" id="permalink-input" value=${url} style="width: 600px" />
    `;
  }
}

customElements.define('permalink-element', Permalink);
