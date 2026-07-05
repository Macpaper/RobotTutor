// db/seed.js
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('./db/database.db');

// Add a student
const hashed = bcrypt.hashSync('password123', 10);
db.prepare(`
  INSERT INTO students (username, password) VALUES (?, ?)
`).run('student1', hashed);

console.log('Seeded.');