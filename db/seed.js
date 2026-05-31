// db/seed.js
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('./db/database.db');

// Add exercises
db.prepare(`
  INSERT INTO exercises (title, description, starter_code, checks)
  VALUES (?, ?, ?, ?)
`).run(
  'Loops Exercise',
  'Create a for loop that prints your name 20 times. Then a while loop that prints 1-10.',
  '# Your code here\n',
  JSON.stringify({ hasFor: true, hasWhile: true })
);

// Add a student
const hashed = bcrypt.hashSync('password123', 10);
db.prepare(`
  INSERT INTO students (username, password) VALUES (?, ?)
`).run('student1', hashed);

console.log('Seeded.');