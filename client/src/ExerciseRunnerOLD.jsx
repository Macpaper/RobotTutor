import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
import { runCode } from './runCode.js';
import { exerciseChecks } from './exerciseChecks.js';
import './ExerciseRunner.css';

/**
 * ExerciseRunner
 * Mount with a setId (e.g. "js-refresher-1"). Fetches the set + its
 * exercises from the server, then steps through them one at a time.
 */
export default function ExerciseRunner({ setId }) {
  const [set, setSet] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState([]); // array of exerciseIds passed this session
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exercise-sets/${setId}`)
      .then((res) => res.json())
      .then((data) => {
        setSet(data.set);
        setExercises(data.exercises);
        setCode(data.exercises[0]?.starterCode || '');
        setLoading(false);
      });
  }, [setId]);

  if (loading) return <p className="exercise-runner__status">Loading...</p>;
  if (!set) return <p className="exercise-runner__status">Set not found.</p>;

  const exercise = exercises[index];
  const isLast = index === exercises.length - 1;

  function handleCheck() {
    const { output, error } = runCode(code);

    if (error) {
      alert(`Error in your code:\n${error}`);
      return;
    }

    const checkFn = exerciseChecks[exercise.id];
    const isCorrect = checkFn ? checkFn(code, output) : false;

    if (isCorrect) {
      alert('Correct! 🎉');
      setPassed((prev) => [...prev, exercise.id]);
      if (!isLast) {
        const next = index + 1;
        setIndex(next);
        setCode(exercises[next].starterCode || '');
      } else {
        alert('Set complete!');
      }
    } else {
      alert('Not quite — try again.');
    }
  }

  return (
    <div className="exercise-runner">
      <div className="exercise-runner__dots">
        {exercises.map((ex, i) => {
          const status = passed.includes(ex.id) ? 'complete' : i === index ? 'current' : 'upcoming';
          return <span key={ex.id} className={`exercise-runner__dot exercise-runner__dot--${status}`} />;
        })}
      </div>

      <h1 className="exercise-runner__title">{exercise.title}</h1>

      <div
        className="exercise-runner__description"
        dangerouslySetInnerHTML={{ __html: marked.parse(exercise.description) }}
      />

      <div className="exercise-runner__editor">
        <Editor
          height="240px"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      <button className="exercise-runner__check-btn" onClick={handleCheck}>
        Check
      </button>
    </div>
  );
}
