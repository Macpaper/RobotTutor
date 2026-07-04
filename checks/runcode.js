// checks/runCode.js
// Server-side runner used for grading. Uses Node's built-in vm module to at
// least keep student code out of the real process global scope (no require,
// no process, no fs by default).
//
// Important: Node's own docs are explicit that `vm` is NOT a real security
// boundary — a determined attacker can escape it. For a classroom tool with
// known, enrolled students, this is a reasonable bar (it guards against
// accidents — infinite loops, stray globals — not malicious attacks). If this
// app ever opens up to the public internet, revisit with a real sandboxing
// library (isolated-vm) or run submissions in an isolated subprocess/container
// with resource limits instead.

const vm = require('vm');

function runCode(code, { timeout = 1000 } = {}) {
  const output = [];
  const sandbox = {
    console: { log: (...args) => output.push(args.map(String).join(' ')) },
  };
  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(code, context, { timeout });
    return { output, error: null, context };
  } catch (e) {
    return { output, error: e.message, context };
  }
}

// Runs an additional snippet against an already-populated sandbox context —
// used by checkers that need to grab a defined function and call it directly
// (e.g. func-basic-3, which needs to invoke `double` to check its return value).
function runInContext(code, context, { timeout = 1000 } = {}) {
  return vm.runInContext(code, context, { timeout });
}

module.exports = { runCode, runInContext };