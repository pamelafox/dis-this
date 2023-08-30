import {LitElement, html, css} from 'lit';

export class DisTable extends LitElement {
  static properties = {
    operations: {type: Array},
    activeLine: {type: Number},
    links: {type: Object},
  };

  static styles = css`
    .highlighted {
      background-color: #d2ffff;
    }
  `;

  constructor() {
    super();
  }

  render() {
    if (!this.operations || !this.operations.length) return;

    return html`
      <table id="disassemble-output" class="table table-sm">
        <thead>
          <tr>
            <th>Line number</th>
            <th>Offset</th>
            <th>Opcode name</th>
            <th>Opcode parameters</th>
            <th>Interpretation of parameters</th>
          </tr>
        </thead>
        <tbody id="disassemble-rows">
          ${this.operations.map(
            (operation) => html` <tr
              @mouseover=${() => this.onMouseover(operation.lineNo)}
              class=${operation.lineNo == this.activeLine ? 'highlighted' : ''}>
              <td>${operation.lineNo}</td>
              <td>${operation.offset}</td>
              <td>
                <a href="${this.links[operation.opcode]}" target="_blank"> ${operation.opcode} </a>
              </td>
              <td>${operation.param}</td>
              <td>${operation.paramD}</td>
            </tr>`
          )}
        </tbody>
      </table>
    `;
  }

  onMouseover(lineNo) {
    this.activeLine = lineNo;
    this.dispatchEvent(new CustomEvent('line-highlight', {detail: {line: lineNo}}));
  }
}

customElements.define('dis-table-element', DisTable);
