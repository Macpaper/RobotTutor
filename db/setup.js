// db/setup.js
const Database = require('better-sqlite3');
const db = new Database('./db/database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    join_date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starter_code TEXT,
    checks TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    exercise_id INTEGER REFERENCES exercises(id),
    code TEXT NOT NULL,
    passed INTEGER NOT NULL,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Tables created.');