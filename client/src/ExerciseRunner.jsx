import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
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
  const [checking, setChecking] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text }
  const [isLightMode, setIsLightMode] = useState(() =>
    document.body.classList.contains('light-mode')
  );

  useEffect(() => {
    function handleThemeChange(e) {
      setIsLightMode(e.detail.isLight);
    }
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

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

  async function handleRun() {
    setRunning(true);
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, setId }),
      });
      const { consoleOutput: output, error } = await res.json();
      setConsoleOutput(error ? [`Error: ${error}`] : (output || []));
    } catch {
      setConsoleOutput(['Something went wrong running your code.']);
    } finally {
      setRunning(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, setId }),
      });
      const { passed: isCorrect, error, feedback, consoleOutput: output } = await res.json();
      setConsoleOutput(output || []);

      if (error) {
        alert(`Error in your code:\n${error}`);
        return;
      }

      if (isCorrect) {
        setPassed((prev) => [...prev, exercise.id]);
        if (!isLast) {
          setStatusMessage({ type: 'success', text: 'Correct! 🎉 Moving to the next exercise...'})
          const next = index + 1;
          setTimeout(() => {
            setIndex(next);
            setCode(exercises[next].starterCode || '');
            setHint(null);
            setConsoleOutput([]);
            setStatusMessage(null);
          }, 1200);
        } else {
          setStatusMessage({ type: 'success', text: '🎉 Set complete! Great work.' })
        }
      } else {
        setStatusMessage({ type: 'error', text: feedback || 'Not quite — try again.' });
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleGetHint() {
    setHintLoading(true);
    setHint(null);
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          exerciseDescription: exercise.description,
        }),
      });
      const { hint: hintText } = await res.json();
      setHint(hintText);
    } catch {
      setHint('Sorry, something went wrong getting a hint.');
    } finally {
      setHintLoading(false);
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
          theme={isLightMode ? 'vs' : "vs-dark"}
          value={code}
          onChange={(value) => setCode(value ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="exercise-runner__actions">
        <button className="exercise-runner__run-btn" onClick={handleRun} disabled={running}>
          {running ? 'Running...' : '▶ Run'}
        </button>
        <button className="exercise-runner__check-btn" onClick={handleCheck} disabled={checking}>
          { checking ? 'Checking...' : 'Check' }
        </button>
        <button className="exercise-runner__hint-btn" onClick={handleGetHint} disabled={hintLoading}>
          {hintLoading ? 'Thinking...' : '💡 Get a Hint'}
        </button>
      </div>

      {statusMessage && (
        <div className={`exercise-runner__status-msg exercise-runner__status-msg--${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="exercise-runner__console">
        <div className="exercise-runner__console-header">Console</div>
        {consoleOutput.length === 0 ? (
          <p className="exercise-runner__console-empty">No output yet — hit Check to run your code.</p>
        ) : (
          consoleOutput.map((line, i) => (
            <div key={i} className="exercise-runner__console-line">{line}</div>
          ))
        )}
      </div>

      {hint && (
        <div
          className="exercise-runner__hint"
          dangerouslySetInnerHTML={{ __html: marked.parse(hint) }}
        />
      )}

      {/* <button className="exercise-runner__check-btn" onClick={handleCheck} disabled={checking}>
        {checking ? 'Checking...' : 'Check'}
      </button> */}
    </div>
  );
}
