import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
import './ExerciseRunner.css';
import confetti from 'canvas-confetti';

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
  const [conceptExplanation, setConceptExplanation] = useState(null);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text }
  const [justCompleted, setJustCompleted] = useState(null);
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

  // useEffect(() => {
  //   if (!exercises[index]?.id) return;

  //   let cancelled = false;

  //   async function loadConcept() {
  //     setConceptLoading(true);
  //     setConceptExplanation(null);
  //     try {
  //       const res = await fetch(`/api/exercises/${exercises[index].id}/explain-concept`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //       });
  //       const { explanation } = await res.json();
  //       if (!cancelled) {
  //         setConceptExplanation(explanation);
  //       }
  //     } catch {
  //       if (!cancelled) {
  //         setConceptExplanation('Sorry, something went wrong explaining this concept.');
  //       }
  //     } finally {
  //       if (!cancelled) {
  //         setConceptLoading(false);
  //       }
  //     }
  //   }

  //   loadConcept();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [exercises, index]);

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

      const exerciseId = exercise.id;
      const submissionPostResponse = await fetch('/exercises', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, code, passed: isCorrect }),
      });

       if (!submissionPostResponse.ok) {
        throw new Error(`HTTP error! Status: ${submissionPostResponse.status} didn't submit something to db`);
       }

      if (error) {
        alert(`Error in your code:\n${error}`);
        return;
      }

      if (isCorrect) {
        setPassed((prev) => [...prev, exercise.id]);
        setJustCompleted(exercise.id);
        setTimeout(() => setJustCompleted(null), 600); // matches animation duration
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
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });
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

  async function handleExplainConcept() {
    setConceptLoading(true);
    setConceptExplanation(null);
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/explain-concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { explanation } = await res.json();
      setConceptExplanation(explanation);
    } catch {
      setConceptExplanation('Sorry, something went wrong explaining this concept.');
    } finally {
      setConceptLoading(false);
    }
  }

  return (
    <div className="exercise-runner-layout">

      {/* LEFT SIDEBAR — empty for now, ready for concept drawer / other-exercises list */}
      <aside className="exercise-runner__left-panel">
        {/* future: concept prerequisite buttons, exercise set navigation, etc. */}
      </aside>

      {/* MAIN COLUMN — unchanged from what you have now */}
      <div className="exercise-runner">
        <div className="exercise-runner__dots">
          {exercises.map((ex, i) => {
            const status = passed.includes(ex.id) ? 'complete' : i === index ? 'current' : 'upcoming';
            const isPulsing = justCompleted === ex.id;
            return (
              <span
                key={ex.id}
                className={`exercise-runner__dot exercise-runner__dot--${status} ${isPulsing ? 'exercise-runner__dot--pulse' : ''}`}
              />
            );
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
            theme={isLightMode ? 'vs' : 'vs-dark'}
            value={code}
            onChange={(value) => setCode(value ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
          />
        </div>

        <div className="exercise-runner__actions">
          <button className="exercise-runner__run-btn" onClick={handleRun} disabled={running}>
            {running ? 'Running...' : '▶ Run'}
          </button>
          <button className="exercise-runner__check-btn" onClick={handleCheck} disabled={checking}>
            {checking ? 'Checking...' : 'Check'}
          </button>
          <button className="exercise-runner__hint-btn" onClick={handleGetHint} disabled={hintLoading}>
            {hintLoading ? 'Thinking...' : '💡 Get a Hint'}
          </button>
          <button className="exercise-runner__concept-btn" onClick={handleExplainConcept} disabled={conceptLoading}>
            {conceptLoading ? 'Explaining...' : '📖 Explain Concept'}
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
      </div>

      {/* RIGHT SIDEBAR — the concept-explanation panel from before */}
      {conceptExplanation && (
        <aside className="exercise-runner__concept-panel">
          <div className="exercise-runner__concept-panel-header">
            <span>📖 Concept: {exercise.concept}</span>
            <button
              className="exercise-runner__concept-panel-close"
              onClick={() => setConceptExplanation(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div
            className="exercise-runner__concept-panel-body"
            dangerouslySetInnerHTML={{ __html: marked.parse(conceptExplanation) }}
          />
        </aside>
      )}
    </div>
  );
}
