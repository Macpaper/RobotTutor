// checks/exerciseChecks.js
// Server-side source of truth for grading. Mirrors the client-side version
// in client/src/exerciseChecks.js (used for instant in-browser feedback),
// but this is the one that actually decides what gets written to the DB.

const exerciseChecks = {
  'func-basic-1': (code, consoleOutput) => {
    const definesFunction = /function\s+greeting\s*\(\s*\)/.test(code);
    const printed = consoleOutput.some((line) => line.includes('Hello!'));
    return definesFunction && printed;
  },

  'func-basic-2': (code, consoleOutput) => {
    const definesFunction = /function\s+greetPerson\s*\(\s*name\s*\)/.test(code);
    const printed = consoleOutput.some((line) => line.includes('Greetings,'));
    return definesFunction && printed;
  },

  'func-basic-3': (code, consoleOutput, runInSandbox) => {
    try {
      const double = runInSandbox(`${code}\ndouble;`);
      if (typeof double !== 'function') return false;
      return double(5) === 10 && double(0) === 0 && double(-3) === -6;
    } catch {
      return false;
    }
  },
};

module.exports = { exerciseChecks };