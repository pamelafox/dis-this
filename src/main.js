import './dis-table-element.js';
import './permalink-element.js';
import HighlightableEditor from './highlightable-editor.js';
import opcodeLinks from './links.json';

async function main() {
  let pyodide,
    editor,
    ops = [],
    disTable,
    callMode = false,
    permalink,
    pythonVersion;
  const codeDiv = document.getElementById('code-area');
  const button = document.getElementById('button');
  const statusDiv = document.getElementById('status');
  const tableDiv = document.getElementById('table-area');
  const permalinkDiv = document.getElementById('permalink-area');
  const errorDiv = document.getElementById('error-area');
  const outputDiv = document.getElementById('output-area');

  function disassembleCode() {
    statusDiv.innerText = 'Disassembling...';
    const code = editor.getCode();
    const functionCall = document.getElementById('call-input').value;
    const functionName = functionCall.split('(')[0];
    ops = [];
    const enableAdaptive = document.getElementById('adaptive-checkbox').checked ? 'True' : 'False';
    // Support the old way of disassembling a sequence of statements
    if (!functionCall) {
      callMode = false;
      pyodide.runPython(`import dis; dis.dis('''${code}''');`);
    } else {
      callMode = true;
      try {
        let disLine = `dis.dis(${functionName})`;
        if (enableAdaptive === 'True') {
          disLine = `dis.dis(${functionName}, adaptive=${enableAdaptive}, show_caches=False)`;
        }

        pyodide.runPython(`
import sys, dis
print(sys.version)
${code}
for _ in range(10):
  ${functionCall}
${disLine}
        `);
      } catch (e) {
        statusDiv.innerText = '';
        errorDiv.style.display = 'block';
        outputDiv.style.display = 'none';
        errorDiv.innerText = e;
        return;
      }
    }
    statusDiv.innerText = '';
    errorDiv.style.display = 'none';
    outputDiv.style.display = 'block';
    disTable.setAttribute('operations', JSON.stringify(ops));
    permalink.setAttribute('code', code);
    permalink.setAttribute('call', functionCall);
    permalink.setAttribute('adaptive', enableAdaptive);
    permalink.setAttribute('version', pythonVersion);
  }

  function handleStdOut(output) {
    if (output.startsWith('3.')) {
      // Python version
      document.getElementById('version-number').innerText = output.split(' ')[0];
      return;
    }
    const matches = output.match(/\s*(\d+)?\s+(\d+)\s+([A-Z_]+)\s*(\d+)?\s*(\([^\)]+\))?/);
    if (!matches) {
      return;
    }
    let lineNo;
    if (typeof matches[1] !== 'undefined') {
      // Some instructions start with a line number
      lineNo = parseInt(matches[1], 10) - (callMode ? 3 : 0);
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

  async function loadPyodideScript() {
    const versionMap = {
      3.11: 'dev',
      '3.10': 'v0.22.1',
      3.9: 'v0.19.1',
    };
    if (pythonVersion !== '3.11') {
      document.getElementById('adaptive-area').style.display = 'none';
    }
    const pyodideVersion = versionMap[pythonVersion];
    const scriptUrl = `https://cdn.jsdelivr.net/pyodide/${pyodideVersion}/full/pyodide.js`;

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = async () => {
      pyodide = await loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/${pyodideVersion}/full/`,
        stdout: handleStdOut,
      });
      statusDiv.innerText = '';
      button.removeAttribute('disabled');
      button.addEventListener('click', disassembleCode);
      code && disassembleCode();
    };
    document.head.appendChild(script);
  }

  let code = new URLSearchParams(window.location.search).get('code');
  let call = new URLSearchParams(window.location.search).get('call');
  if (!code) {
    code = `def feet_to_meters(feet):
    result = 0.3048 * feet
    return result`;
    call = 'feet_to_meters(10)';
  }
  pythonVersion = new URLSearchParams(window.location.search).get('version') || '3.11';
  document.getElementById('version-select').value = pythonVersion;
  let adaptive = new URLSearchParams(window.location.search).get('adaptive');
  document.getElementById('adaptive-checkbox').checked = pythonVersion == '3.11' && adaptive === 'True';

  editor = new HighlightableEditor(codeDiv, code, (lineNo) => {
    disTable.setAttribute('activeLine', lineNo);
  });
  document.getElementById('call-input').value = call;
  disTable = document.createElement('dis-table-element');
  disTable.setAttribute('links', JSON.stringify(opcodeLinks[pythonVersion]));
  disTable.setAttribute('operations', JSON.stringify(ops));
  disTable.addEventListener('line-highlight', (e) => {
    editor.highlightLine(e.detail.line);
  });
  tableDiv.appendChild(disTable);
  permalink = document.createElement('permalink-element');
  permalinkDiv.appendChild(permalink);

  document.getElementById('version-select').addEventListener('change', async () => {
    pythonVersion = document.getElementById('version-select').value;
    permalink.setAttribute('version', pythonVersion);
    window.location.search = permalink.path;
  });
  await loadPyodideScript();
}

main();
