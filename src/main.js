
var pyodide, editor, lastLineNo;
 
    function disassembleCode() {
        document.getElementById("disassemble-status").innerHTML = "Disassembling...";
        const code = editor.getValue();
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
          for (var i = 0; i <= lastLineNo; i++) editor.getDoc().removeLineClass(i, 'wrap', 'highlighted-line');
          editor.getDoc().addLineClass((lineNo - 1), 'wrap', 'highlighted-line');
        });
        lastLineNo = lineNo;
    }

    async function main() {
      const code = new URLSearchParams(window.location.search).get('code');
      editor = new CodeMirror(document.getElementById('code-textarea'), {
        lineNumbers: true,
        value: code || '',
        mode: 'python'
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
