require('dotenv').config()
const pool = require('./index');

async function setup() {
  await pool.query(`
    DROP TABLE IF EXISTS submissions;
    DROP TABLE IF EXISTS students;

    CREATE TABLE students (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE submissions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      exercise_id TEXT NOT NULL,
      code TEXT NOT NULL,
      passed BOOLEAN NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_submissions_student ON submissions(student_id);
  `);
  console.log('Tables created.');
  await pool.end();
}

setup();