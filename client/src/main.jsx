import { createRoot } from 'react-dom/client';
import ExerciseRunner from './ExerciseRunner.jsx';

const exerciseRoot = document.getElementById('exercise-runner-root');
if (exerciseRoot) {
  createRoot(exerciseRoot).render(
    <ExerciseRunner setId={exerciseRoot.dataset.setId} />
  );
}