import { useMemo, useState } from 'react';
import './ProgressPath.css';

const STATUS = {
  COMPLETE: 'complete',
  CURRENT: 'current',
  LOCKED: 'locked',
};

// Lays nodes out in a zigzag, 3 per row, alternating direction —
// the "board game path" feel, computed instead of hand-placed.
function getNodePositions(count, width = 640, rowHeight = 160) {
  const perRow = 3;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const leftToRight = row % 2 === 0;
    const step = (width - 120) / (perRow - 1);
    const x = leftToRight ? 60 + col * step : width - 60 - col * step;
    const y = 90 + row * rowHeight;
    positions.push({ x, y });
  }
  return positions;
}

// Smooth curved trace between nodes instead of straight zigzag lines.
function buildPathD(positions) {
  if (positions.length === 0) return '';
  let d = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/**
 * ProgressPath
 *
 * @param {Array} lessons - [{ id, title, status: 'complete' | 'current' | 'locked' }]
 * @param {Function} [onNavigate] - called with the lesson object on click.
 *   Defaults to window.location.href = `/lessons/${id}` if omitted.
 */
export default function ProgressPath({ lessons, onNavigate }) {
  const [hovered, setHovered] = useState(null);
  const positions = useMemo(() => getNodePositions(lessons.length), [lessons.length]);
  const pathD = useMemo(() => buildPathD(positions), [positions]);
  const height = positions.length ? positions[positions.length - 1].y + 100 : 200;

  function handleActivate(lesson) {
    if (lesson.status === STATUS.LOCKED) return;
    if (onNavigate) onNavigate(lesson);
    else window.location.href = `/lessons/${lesson.id}`;
  }

  return (
    <div className="progress-path">
      <svg
        viewBox={`0 0 640 ${height}`}
        className="progress-path__svg"
        role="img"
        aria-label="Lesson progress map"
      >
        <path d={pathD} className="progress-path__trace" fill="none" />

        {positions.map((pos, i) => {
          const lesson = lessons[i];
          const locked = lesson.status === STATUS.LOCKED;

          return (
            <g
              key={lesson.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className={`progress-node progress-node--${lesson.status} ${
                hovered === lesson.id ? 'is-hovered' : ''
              }`}
              onClick={() => handleActivate(lesson)}
              onMouseEnter={() => setHovered(lesson.id)}
              onMouseLeave={() => setHovered(null)}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              aria-label={`${lesson.title} — ${lesson.status}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleActivate(lesson);
                }
              }}
            >
              {lesson.status === STATUS.CURRENT && (
                <circle className="progress-node__pulse" r="30" />
              )}

              <polygon
                className="progress-node__hex"
                points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
              />

              {lesson.status === STATUS.COMPLETE ? (
                <path
                  className="progress-node__check"
                  d="M -10 0 L -3 8 L 12 -10"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : locked ? (
                <g className="progress-node__lock">
                  <rect x="-8" y="-2" width="16" height="12" rx="2" />
                  <path d="M -5 -2 L -5 -7 A 5 5 0 0 1 5 -7 L 5 -2" fill="none" strokeWidth="2.5" />
                </g>
              ) : (
                <text className="progress-node__num" textAnchor="middle" dominantBaseline="central">
                  {i + 1}
                </text>
              )}

              <text className="progress-node__label" y="46" textAnchor="middle">
                {lesson.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
