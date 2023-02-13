import {LitElement, html} from 'lit';

export class Permalink extends LitElement {
  static properties = {
    code: {type: String},
    call: {type: String},
  };

  constructor() {
    super();
  }

  render() {
    if (!this.code) return;

    const url = `${window.location.origin}/?code=${encodeURIComponent(this.code)}&call=${encodeURIComponent(this.call)}`
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    return html`
      <label for="permalink-input">Permalink:</label>
      <input type="url" id="permalink-input" value=${url} style="width: 600px" />
    `;
  }
}

customElements.define('permalink-element', Permalink);
