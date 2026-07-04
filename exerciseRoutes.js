const express = require('express');
const router = express.Router();
const exerciseData = require('./exercises.json'); // swap for a DB call later

// Page route — just renders the mount point, setId comes from the URL.
router.get('/exercises/:setId', (req, res) => {
  res.render('exercisePage', { setId: req.params.setId });
});

// API route — only sends the exercises this specific set needs, not the
// whole exercises.json. This is what keeps things scalable as content grows.
router.get('/api/exercise-sets/:setId', (req, res) => {
  const set = exerciseData.sets.find((s) => s.id === req.params.setId);
  if (!set) return res.status(404).json({ error: 'Set not found' });

  const exercises = set.exerciseIds
    .map((id) => exerciseData.exercises.find((ex) => ex.id === id))
    .filter(Boolean);

  res.json({ set, exercises });
});

module.exports = router;
