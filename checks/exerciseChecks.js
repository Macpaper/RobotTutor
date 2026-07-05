// checks/exerciseChecks.js
// Server-side source of truth for grading. Mirrors the client-side version
// in client/src/exerciseChecks.js (used for instant in-browser feedback),
// but this is the one that actually decides what gets written to the DB.

const exerciseChecks = {
  'func-basic-1': (code, consoleOutput, runInSandbox) => {
    try {
      const greeting = runInSandbox('greeting');
      if (typeof greeting !== 'function') return false;

      // Count occurrences of "greeting(" — the function definition itself
      // accounts for exactly one. A genuine call elsewhere means 2+.
      const occurrences = (code.match(/greeting\s*\(/g) || []).length;
      if (occurrences < 2) return false;


      const beforeLength = consoleOutput.length;
      runInSandbox('greeting()');
      const newLines = consoleOutput.slice(beforeLength);
      return newLines.some((line) => line.includes('Hello!'));
    } catch {
      return false;
    }
  },

  'func-basic-2': (code, consoleOutput, runInSandbox) => {
    try {
      const greetPerson = runInSandbox('greetPerson');
      if (typeof greetPerson !== 'function') return false;
      if (greetPerson.length !== 1) return false; // must accept exactly one parameter

      const occurrences = (code.match(/greetPerson\s*\(/g) || []).length;
      if (occurrences < 2) return false;

      const beforeLength = consoleOutput.length;
      runInSandbox('greetPerson("Zorblex123")'); // call it with a distinctive test name
      const newLines = consoleOutput.slice(beforeLength);

      return newLines.some((line) => line.includes('Greetings,') && line.includes('Zorblex123'));
    } catch {
      return false;
    }
  },

  'func-basic-3': (code, consoleOutput, runInSandbox) => {
    try {
      const double = runInSandbox('double');
      if (typeof double !== 'function') return false;
      if (double.length !== 1) return false;

      const occurrences = (code.match(/double\s*\(/g) || []).length;
      if (occurrences < 2) return false;

      return double(5) === 10 && double(0) === 0 && double(-3) === -6;
    } catch {
      return false;
    }
  },
  'func-basic-4': (code, consoleOutput, runInSandbox) => {
    try {
      const getRectangleArea = runInSandbox('getRectangleArea');
      if (typeof getRectangleArea !== 'function') return false;
      if (getRectangleArea.length !== 2) return false;

      const occurrences = (code.match(/getRectangleArea\s*\(/g) || []).length;
      if (occurrences < 2) return false;

      const cases = [[4, 5], [10, 10], [3, 7], [1, 1]];
      return cases.every(([w, h]) => getRectangleArea(w, h) === w * h);
    } catch {
      return false;
    }
  },

  'func-basic-5': (code, consoleOutput, runInSandbox) => {
    try {
      const maxOfThree = runInSandbox('maxOfThree');
      if (typeof maxOfThree !== 'function') return false;
      if (maxOfThree.length !== 3) return false;

      const occurrences = (code.match(/maxOfThree\s*\(/g) || []).length;
      if (occurrences < 2) return false;

      const cases = [[1, 2, 3], [10, 5, 2], [-1, -5, -2], [0, 0, 0]];
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
    const printedMultiple = consoleOutput.length >= 3;
    return hasLoop && printedMultiple;
  },
  'arr-basic-3': (code, consoleOutput) => {
    // Capture the variable name used before [0], require the SAME variable used before [2]
    const firstAccess = code.match(/(\w+)\s*\[\s*0\s*\]/);
    const thirdAccess = code.match(/(\w+)\s*\[\s*2\s*\]/);
    const sameVariable = firstAccess && thirdAccess && firstAccess[1] === thirdAccess[1];
    const printedTwice = consoleOutput.length >= 2;
    return sameVariable && printedTwice;
  },
};

module.exports = { exerciseChecks };