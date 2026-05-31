require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs' }
});

const pathThing = ['vs/editor/editor.main']
require(pathThing, editors)

async function editors() {
  const res = await fetch('/scripts/starter.py');
  const starterCode = await res.text();
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: starterCode,
    language: 'python',
    theme: 'vs-dark',        // vs-dark, vs, hc-black
    fontSize: 14,
    minimap: { enabled: false },  // that tiny code preview on the right
    automaticLayout: true,        // resizes with the container
  });

  // Get the code value later:
  const code = editor.getValue();
  console.log(code)
}


async function main() {
  let pyodide = await loadPyodide();
  // Pyodide is now ready to use...

  console.log(pyodide.runPython(`
    import sys
    sys.version
  `));
  pyodide.runPython("print(1+1)");
};
main();

