// routes/exercises.js
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const exerciseData = require('../data/exercises.json'); // swap for a DB later if you want persistence
const { runCode, runInContext } = require('../checks/runCode');
const { exerciseChecks } = require('../checks/exerciseChecks');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const router = express.Router();

// Page route — renders the mount point, setId comes from the URL.
router.get('/exercises/:setId', (req, res) => {
  res.render('exercisePage', { title: "hahaTeeHee", setId: req.params.setId });
});

// Returns just the exercises for one set (not the whole exercises.json).
router.get('/api/exercise-sets/:setId', (req, res) => {
  const set = exerciseData.sets.find((s) => s.id === req.params.setId);
  if (!set) return res.status(404).json({ error: 'Set not found' });

  const exercises = set.exerciseIds
    .map((id) => exerciseData.exercises.find((ex) => ex.id === id))
    .filter(Boolean);

  res.json({ set, exercises });
});

// Grades a single exercise submission. No persistence yet — just runs the
// code server-side and returns pass/fail. Wire this into a students/progress
// table later without touching anything above.
router.post('/api/exercises/:exerciseId/check', (req, res) => {
  const { code } = req.body;
  const studentId = req.session.studentId;
  const exercise = exerciseData.exercises.find((ex) => ex.id === req.params.exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  const { output, error, context } = runCode(code);

  let passed = false;
  if (!error) {
    const checkFn = exerciseChecks[exercise.id];
    const runInSandbox = (snippet) => runInContext(snippet, context);
    passed = checkFn ? checkFn(code, output, runInSandbox) : false;
  }

    // studentId is right here whenever you're ready to persist this —
  // e.g. db.prepare('INSERT INTO submissions (student_id, exercise_id, code, passed) VALUES (?, ?, ?, ?)')
  //        .run(studentId, exercise.id, code, passed ? 1 : 0);

  res.json({
    passed,
    error,
    feedback: error ? `Error: ${error}` : passed ? 'Correct!' : 'Not quite — try again.',
  });
});

// Generates a hint for one exercise, using JS-specific framing in the prompt.
router.post('/api/exercises/:exerciseId/hint', async (req, res) => {
  const { code } = req.body;
  const exercise = exerciseData.exercises.find((ex) => ex.id === req.params.exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
 
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `
        You are a friendly JavaScript tutor helping a beginner student.
        The exercise is: "${exercise.description}"
 
        The student's current code is:
            \`\`\`javascript
            ${code}
            \`\`\`
 
        Give a short hint that guides them without giving away the full answer.
        - If their code is empty or barely started, give a gentle nudge on where to begin.
        - If they're close, point out specifically what's missing or wrong.
        - Use code examples only if really necessary, and keep them partial/incomplete.
        - Keep it to 2-3 sentences max.
        - Use markdown formatting.
      `,
    });
    console.log("response here: ", response.text)
    res.json({ hint: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

module.exports = router;