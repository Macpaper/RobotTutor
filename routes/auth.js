const express = require('express');
const bcrypt = require('bcrypt');
// const Database = require('better-sqlite3');
const pool = require('../db/index');
const exerciseData = require('../data/exercises.json');

const router = express.Router();
// const db = new Database('./db/database.db');

function requireLogin(req, res, next) {
    if (!req.session.studentId) return res.redirect('/login');
    next();
}

function requireTeacher(req, res, next) {
    if (!req.session.isTeacher) return res.redirect('/login');
    next();
}

router.get('/login', (req, res) => {
    if (req.session.studentId) return res.redirect('/home');
    if (req.session.isTeacher) return res.redirect('/dashboard');
    res.render('login', { title: 'Login', error: null});
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'teacher' && password === process.env.TEACHER_PASSWORD) {
    req.session.isTeacher = true;
    return res.redirect('/dashboard');
  }

  try {
    const result = await pool.query('SELECT * FROM students WHERE username = $1', [username]);
    const student = result.rows[0];

    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.render('login', { title: 'Login', error: 'Invalid username or password' });
    }

    req.session.studentId = student.id;
    req.session.username = student.username;
    res.redirect('/home')
  } catch (err) {
    console.error(err);
    res.render('login', { title: 'Login', error: 'Something went wrong. Please try again.' });
  }
});

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Signup', error: null });
});

// router.post('/exercises')

router.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.render('signup', { title: 'Signup', error: 'Username and password are required.' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.render('signup', { title: 'Signup', error: 'Username must be 3-20 characters.' });
  }
  if (password.length < 6) {
    return res.render('signup', { title: 'Signup', error: 'Password must be at least 6 characters.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const insertResult = await pool.query(
      `INSERT INTO students (username, password, email) VALUES ($1, $2, $3) RETURNING id, username`,
      [username, hashed, email || null]
    );
    const student = insertResult.rows[0];

    req.session.studentId = student.id;
    req.session.username = student.username;
    res.redirect('/home');
  } catch (err) {
    if (err.code == '23505') {
      return res.render('signup', { title: 'Signup', error: 'That username is already taken.' });
    }
    console.error(err);
    res.render('signup', { title: 'Signup', error: 'Something went wrong. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/home', requireLogin, async (req, res) => {
  // lessons1 was defined inline in server.js — pass it in or import from data/
  res.render('home', { title: 'Home', username: req.session.username });
});

router.get('/dashboard', requireTeacher, async (req, res) => {
  try {
    const studentsResult = await pool.query('SELECT * FROM students');
    const students = studentsResult.rows;

    const submissionsResult = await pool.query(`
      SELECT s.*, st.username,
      FROM submissions s
      JOIN students st ON s.student_id = st.id
      ORDER BY s.submitted_at DESC
    `);

    const submissions = submissionsResult.rows.map((sub) => {
      const exercise = exerciseData.exercises.find((ex) => ex.id === sub.exercise_id);
      return {
        ...sub,
        exercise_title: exercise ? exercise.title : sub.exercise_id,
      };
    });

    res.render('dashboard', { title: 'Dashboard', students, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load dashboard');
  }


  const students = db.prepare('SELECT * FROM students').all();
  const submissions = db.prepare(`
    SELECT s.*, st.username, e.title as exercise_title
    FROM submissions s
    JOIN students st ON s.student_id = st.id
    JOIN exercises e ON s.exercise_id = e.id
    ORDER BY s.submitted_at DESC
  `).all();
  res.render('dashboard', { title: 'Dashboard', students, submissions });
});

module.exports = { router, requireLogin, requireTeacher };