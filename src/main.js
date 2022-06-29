import './dis-table-element.js';
import './permalink-element.js';
import HighlightableEditor from './highlightable-editor.js';

async function main() {
  let pyodide,
    editor,
    ops = [],
    disTable,
    permalink;
  const codeDiv = document.getElementById('code-area');
  const button = document.getElementById('button');
  const statusDiv = document.getElementById('status');
  const tableDiv = document.getElementById('table-area');
  const permalinkDiv = document.getElementById('permalink-area');

  function disassembleCode() {
    statusDiv.innerText = 'Disassembling...';
    ops = [];
    pyodide.runPython(`import dis; dis.dis('''${editor.getCode()}''')`);
    statusDiv.innerHTML = '';
    disTable.setAttribute('operations', JSON.stringify(ops));
    permalink.setAttribute('code', code);
  }

  function handleStdOut(output) {
    const matches = output.match(
      /\s*(\d+)?\s+(\d+)\s+([A-Z_]+)\s*(\d+)?\s*(\(\w+\))?/
    );
    if (!matches) {
      return;
    }
    const lineNo =
      (matches[1] && parseInt(matches[1], 10)) || ops[ops.length - 1].lineNo;
    const offset = matches[2];
    const opcode = matches[3];
    const param = matches[4] || '';
    const paramD = matches[5] || '';
    ops.push({lineNo, offset, opcode, param, paramD});
  }

  const code = new URLSearchParams(window.location.search).get('code');
  editor = new HighlightableEditor(codeDiv, code, (lineNo) => {
    disTable.setAttribute('activeLine', lineNo);
  });
  disTable = document.createElement('dis-table-element');
  disTable.setAttribute('operations', JSON.stringify(ops));
  disTable.addEventListener('line-highlight', (e) => {
    editor.highlightLine(e.detail.line);
  });
  tableDiv.appendChild(disTable);
  permalink = document.createElement('permalink-element');
  permalinkDiv.appendChild(permalink);

  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/',
    stdout: handleStdOut,
  });
  statusDiv.innerText = '';
  button.removeAttribute('disabled');
  button.addEventListener('click', disassembleCode);
  code && disassembleCode();
}

main();
