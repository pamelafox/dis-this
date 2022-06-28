import {basicSetup} from "codemirror"
import {EditorState, StateField, StateEffect} from "@codemirror/state"
import {python} from "@codemirror/lang-python"
import {EditorView, Decoration, gutter, GutterMarker} from "@codemirror/view"

const addLineHighlight = StateEffect.define()

const lineHighlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(lines, tr) {
    lines = lines.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addLineHighlight)) {
        lines = Decoration.none;  
        lines = lines.update({add: [lineHighlightMark.range(e.value)]})
      }
    }
    return lines
  },
  provide: f => EditorView.decorations.from(f)
});

const lineHighlightMark = Decoration.line({
  attributes: {style: "background-color: yellow"}
});

var pyodide, editor, lastLineNo;
 
function disassembleCode() {
    document.getElementById("disassemble-status").innerHTML = "Disassembling...";
    const code = editor.state.doc.toString();
    document.getElementById("disassemble-rows").innerText = '';
    pyodide.runPython(`import dis; dis.dis('''${code}''')`);
    const permalink = `${window.location.origin}/?code=${encodeURIComponent(code)}`.replace(/\(/g, '%28').replace(/\)/g, '%29');
    document.getElementById("permalink-area").style.display = "block";
    document.getElementById("permalink-input").value = permalink;
}

function handleStdOut(output) {
    const matches = output.match(/\s*(\d+)?\s+(\d+)\s+([A-Z_]+)\s*(\d+)?\s*(\(\w+\))?/);
    if (!matches) {
        return;
    }
    document.getElementById("disassemble-status").innerHTML = "";
    const lineNo = (matches[1] && parseInt(matches[1], 10)) || lastLineNo;
    const offset = matches[2];
    const opcode = matches[3];
    const param = matches[4] || '';
    const paramD = matches[5] || '';
    var newRow = document.createElement('tr');
    newRow.innerHTML = `<td>${lineNo}<td>${offset}<td><a href="https://docs.python.org/3/library/dis.html#opcode-${opcode}" target="_blank">${opcode}</a></td><td>${param}<td>${paramD}`;
    document.getElementById("disassemble-rows").appendChild(newRow);
    newRow.addEventListener('mouseover', () => {
        const docPosition = editor.state.doc.line(lineNo).from;
        editor.dispatch({
            effects: addLineHighlight.of(docPosition)
        })
    });
    lastLineNo = lineNo;
} 

async function main() {
      const code = new URLSearchParams(window.location.search).get('code');
      editor = new EditorView({
          state: EditorState.create({
              doc: code,
              extensions: [basicSetup, lineHighlightField, python()]
           }),
          parent: document.getElementById('code-textarea')
      });
      editor.dom.addEventListener('mousemove', (event) => {
          const lastMove = {x: event.clientX, y: event.clientY, target: event.target, time: Date.now()}
          const pos = editor.posAtCoords(lastMove);
          let lineNo = editor.state.doc.lineAt(pos).number;
       });

      pyodide = await loadPyodide({
        indexURL : "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/",
        stdout: handleStdOut,
      });
      document.getElementById("disassemble-status").innerHTML = "";
      document.getElementById("disassemble-button").removeAttribute("disabled");
      document.getElementById("disassemble-button").addEventListener("click", disassembleCode);
      code && disassembleCode();
    };

main();
