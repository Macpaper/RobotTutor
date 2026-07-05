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
  'func-basic-4': (code, consoleOutput, runInSandbox) => {
    try {
      const getRectangleArea = runInSandbox('getRectangleArea');
      if (typeof getRectangleArea !== 'function') return false;
      const cases = [
        [4, 5], [10, 10], [3, 7], [1, 1],
      ];
      return cases.every(([w, h]) => getRectangleArea(w, h) === w * h);
    } catch {
      return false;
    }
  },

  'func-basic-5': (code, consoleOutput, runInSandbox) => {
    try {
      const maxOfThree = runInSandbox('maxOfThree');
      if (typeof maxOfThree !== 'function') return false;

      const cases = [
        [1, 2, 3], [10, 5, 2], [-1, -5, -2], [7, 7, 3], [0, 0, 0],
      ];
      return cases.every(([a, b, c]) => maxOfThree(a, b, c) === Math.max(a, b, c));
    } catch {
      return false;
    }
  },
  'arr-basic-1': (code, consoleOutput, runInSandbox) => {
    try {
      const foods = runInSandbox('foods');
      return (
        Array.isArray(foods) &&
        foods.length >= 5 &&
        foods.every((item) => typeof item === 'string')
      );
    } catch {
      return false;
    }
  },

  'arr-basic-2': (code, consoleOutput) => {
    const hasLoop = /for\s*\(|\.forEach\s*\(|while\s*\(/.test(code);
    const printedMultiple = consoleOutput.length >= 2;
    return hasLoop && printedMultiple;
  },

  'arr-basic-3': (code, consoleOutput) => {
    const hasFirstIndex = /\[\s*0\s*\]/.test(code);
    const hasThirdIndex = /\[\s*2\s*\]/.test(code);
    const printedTwice = consoleOutput.length >= 2;
    return hasFirstIndex && hasThirdIndex && printedTwice;
  },
};

module.exports = { exerciseChecks };