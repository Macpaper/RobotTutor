const exerciseChecks = {
  1: (code, output) => {
    // Check they defined 3 variables and printed something
    const tree_check = `
import ast
code = ${JSON.stringify(code)}
tree = ast.parse(code)

assignments = [n for n in ast.walk(tree) if isinstance(n, ast.Assign)]
has_list = any(isinstance(n, ast.List) for n in ast.walk(tree))
has_print = any(
  isinstance(n, ast.Call) and 
  isinstance(n.func, ast.Name) and 
  n.func.id == 'print' 
  for n in ast.walk(tree)
)

# At least 3 assignments, one is a list, and they printed something
str(len(assignments) >= 3 and has_list and has_print)
    `;
    return pyodide.runPython(tree_check) === 'True';
  },

  2: (code, output) => {
    // Loop printing 1-20 - check output contains 1 through 20
    const lines = output.trim().split('\n').map(l => l.trim());
    const nums = lines.map(Number).filter(n => !isNaN(n));
    return nums.includes(1) && nums.includes(20) && nums.length >= 20;
  },

  3: (code, output) => {
    // Name printed 10 times - same word printed 10 times
    const lines = output.trim().split('\n').map(l => l.trim()).filter(l => l);
    return lines.length >= 10 && new Set(lines).size === 1;
  },

  4: (code, output) => {
    // List of 3 movies, printed with square brackets
    const tree_check = `
import ast
code = ${JSON.stringify(code)}
tree = ast.parse(code)

has_list = any(
  isinstance(n, ast.Assign) and isinstance(n.value, ast.List) and len(n.value.elts) >= 3
  for n in ast.walk(tree)
)
has_subscript = any(isinstance(n, ast.Subscript) for n in ast.walk(tree))

str(has_list and has_subscript)
    `;
    return pyodide.runPython(tree_check) === 'True';
  }
};
let currentIndex = 0;
let editorInstance = null;
let pyodide = null;

require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs' }
});

require(['vs/editor/editor.main'], () => {
  initializeEditor();
  initializePyodide();
});

async function initializePyodide() {
  if (typeof loadPyodide !== 'function') {
    console.warn('Pyodide is not loaded. Make sure the script is included before this file.');
    return;
  }

  pyodide = await loadPyodide();
  console.log('Pyodide loaded');
}

function initializeEditor() {
  if (!window.lessonExercises || !lessonExercises.length) {
    console.error('No lessonExercises defined.');
    return;
  }

  editorInstance = monaco.editor.create(document.getElementById('editor'), {
    value: lessonExercises[0].starterCode || '# Your code here\n',
    language: 'python',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
  });

  loadExercise(0);
}

function loadExercise(index) {
  const ex = lessonExercises[index];
  if (!ex) return;

  document.getElementById('exercise-title').innerText = ex.title || `Exercise ${index + 1}`;
  document.getElementById('exercise-description').innerText = ex.description || '';
  document.getElementById('exercise-counter').innerText = `Exercise ${index + 1} of ${lessonExercises.length}`;

  if (editorInstance) {
    editorInstance.setValue(ex.starterCode || '# Your code here\n');
    editorInstance.layout();
  }
}

async function getHint() {
  const hintBox = document.getElementById('hint-box');
  const hintContent = document.getElementById('hint-content');
  
  hintContent.innerHTML = 'Thinking...';
  hintBox.style.display = 'block';

  const res = await fetch('/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: editorInstance.getValue(),
      exerciseDescription: lessonExercises[currentIndex].description
    })
  });

  const { hint } = await res.json();
  hintContent.innerHTML = marked.parse(hint);  // renders markdown properly
}

async function submitCode() {
  if (!editorInstance) return;
  if (!pyodide) {
    document.getElementById('feedback').innerText = 'Python runtime is still loading. Please wait a moment.';
    return;
  }

  const code = editorInstance.getValue();
  const exercise = lessonExercises[currentIndex];
  let output = '';
  try {
    await pyodide.runPythonAsync(`
      import sys, io
      sys.stdout = io.StringIO()
      `);
    await pyodide.runPythonAsync(code);
    output = await pyodide.runPython(`
      result = sys.stdout.getvalue()
      sys.stdout = sys.__stdout__
      result
    `);
  } catch (e) {
    document.getElementById('feedback').innerText = '❌ Error in your code: ' + formatPythonError(e.message);
    return;
  }

  const checkFn = exerciseChecks[exercise.id];
  const passed = checkFn ? await checkFn(code, output) : false;

  const res = await fetch(`/submit/${exercise.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, passed })
  });

  if (passed) {
    currentIndex++;
    if (currentIndex < lessonExercises.length) {
      loadExercise(currentIndex);
      document.getElementById('feedback').innerText = "Correct! Moving to the next exercise.";
    } else {
      document.getElementById('exercise-area').innerHTML = '<h2>Congratulations! You completed the lesson.</h2>';
    }
  } else {
    document.getElementById('feedback').innerText = 'Try again!';
  }
}

function formatPythonError(errorMessage) {
  const lines = errorMessage.trim().split('\n');
  
  // Find SyntaxError or other error line
  const errorLine = lines.findLast(l => l.trim().match(/^(SyntaxError|NameError|TypeError|ValueError|IndentationError):/));
  
  // Find the line number hint
  const fileLine = lines.findLast(l => l.includes('line ') && l.includes('File'));
  const lineMatch = fileLine?.match(/line (\d+)/);
  const lineNum = lineMatch ? `Line ${lineMatch[1]}: ` : '';

  if (errorLine) {
    return lineNum + errorLine.trim();
  }

  // Fallback - just return the last line
  return lines[lines.length - 1].trim();
}

// async function verifyCode(code, checks) {
//   const result = await pyodide.runPythonAsync(`
// import ast, io, sys

// student_code = ${JSON.stringify(code)}
// checks_passed = {}

// tree = ast.parse(student_code)

// # AST checks
// if ${checks.hasFor ? 'True' : 'False'}:
//     checks_passed['hasFor'] = any(isinstance(n, ast.For) for n in ast.walk(tree))

// if ${checks.hasWhile ? 'True' : 'False'}:
//     checks_passed['hasWhile'] = any(isinstance(n, ast.While) for n in ast.walk(tree))

// # Capture output
// stdout = io.StringIO()
// sys.stdout = stdout
// try:
//     exec(student_code, {})
//     checks_passed['error'] = None
// except Exception as e:
//     checks_passed['error'] = str(e)
// sys.stdout = sys.__stdout__

// checks_passed['output'] = stdout.getvalue().strip()
// checks_passed
//   `);

//   return result.toJs();
// }

// async function main() {
//   if (typeof loadPyodide !== 'function') {
//     console.warn('Pyodide is not loaded.');
//     return;
//   }

//   const pyodide = await loadPyodide();
//   console.log(pyodide.runPython(`import sys\nsys.version`));
//   pyodide.runPython('print(1+1)');
// }

// main();
