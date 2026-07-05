// db/setup.js
const Database = require('better-sqlite3');
const db = new Database('./db/database.db');

db.exec(`
  DROP TABLE IF EXISTS exercises;
  DROP TABLE IF EXISTS submissions;
  DROP TABLE IF EXISTS students;
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    is_active INTEGER DEFAULT 1,
    join_date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    exercise_id TEXT NOT NULL,
    code TEXT NOT NULL,
    passed INTEGER NOT NULL,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
`);

console.log('Tables created.');