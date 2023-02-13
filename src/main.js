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
    const code = editor.getCode();
    const functionCall = document.getElementById('call-input').value;
    const functionName = functionCall.split('(')[0];
    ops = [];
    const enableAdaptive = document.getElementById('adaptive-checkbox').checked ? 'True' : 'False';
    pyodide.runPython(`
import sys, dis
print(sys.version)
${code}
for _ in range(10):
  ${functionCall}
dis.dis(${functionName}, adaptive=${enableAdaptive}, show_caches=${enableAdaptive})
    `);
    statusDiv.innerHTML = '';
    disTable.setAttribute('operations', JSON.stringify(ops));
    permalink.setAttribute('code', code);
    permalink.setAttribute('call', functionCall);
  }

  function handleStdOut(output) {
    console.log(output);
    if (output.startsWith('3.')) { // Python version
      document.getElementById('version-number').innerText = output.split(' ')[0];
      return;
    }
    const matches = output.match(
      /\s*(\d+)?\s+(\d+)\s+([A-Z_]+)\s*(\d+)?\s*(\(\w+\))?/
    );
    if (!matches) {
      return;
    }
    let lineNo;
    if (typeof matches[1] !== 'undefined') {
      // Some instructions start with a line number
      lineNo = parseInt(matches[1], 10) - 3;
    } else {
      // If not, assume line number is same as most recent line number
      lineNo = ops[ops.length - 1].lineNo;
    }
    const offset = matches[2];
    const opcode = matches[3];
    const param = matches[4] || '';
    const paramD = matches[5] || '';
    ops.push({lineNo, offset, opcode, param, paramD});
  }

  let code = new URLSearchParams(window.location.search).get('code');
  let call = new URLSearchParams(window.location.search).get('call');
  if (!code) {
    code = `def feet_to_meters(feet):
    result = 0.3048 * feet
    return result`
    call = 'feet_to_meters(10)';
  }
  editor = new HighlightableEditor(codeDiv, code, (lineNo) => {
    disTable.setAttribute('activeLine', lineNo);
  });
  document.getElementById('call-input').value = call;
  disTable = document.createElement('dis-table-element');
  disTable.setAttribute('operations', JSON.stringify(ops));
  disTable.addEventListener('line-highlight', (e) => {
    editor.highlightLine(e.detail.line);
  });
  tableDiv.appendChild(disTable);
  permalink = document.createElement('permalink-element');
  permalinkDiv.appendChild(permalink);

  pyodide = await loadPyodide({
    //indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/',
    indexURL: 'https://cdn.jsdelivr.net/pyodide/dev/full/',
    stdout: handleStdOut,
  });
  statusDiv.innerText = '';
  button.removeAttribute('disabled');
  button.addEventListener('click', disassembleCode);
  code && disassembleCode();
}

main();
