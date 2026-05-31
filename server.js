require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const lessons = require('./data/lessons');

const session = require('express-session');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const ejsLayouts = require('express-ejs-layouts');

const { GoogleGenAI } = require('@google/genai');
const db = new Database("./db/database.db");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// View engine
app.set('view engine', 'ejs');
app.set('views', './views')
app.use(ejsLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static('public'));
app.use('/scripts', express.static('scripts'));
app.use(express.json());

app.use(express.urlencoded({ extended: true })); 
// not sure what this is either yet
app.use(session({
    secret: 'change-this-to-something-random',
    resave: false,
    saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.studentId) return res.redirect('/login');
  next();
}

function requireTeacher(req, res, next) {
  if (!req.session.isTeacher) return res.redirect('/login');
  next();
}

app.use((req, res, next) => {
    res.locals.studentId = req.session.studentId || null;
    res.locals.isTeacher = req.session.isTeacher || false;
    res.locals.username = req.session.username || null;
    next();
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/lessons', requireLogin, (req, res) => {
    res.render('lessons', { title: 'Lessons' });
})

app.get('/lessons/:id', requireLogin, (req, res) => {
    const lesson = lessons.find(l => l.id === parseInt(req.params.id));
    if (!lesson) return res.status(404).send('Lesson not found');

    res.render(`lessons/${req.params.id}`, { title: lesson.title });
});

app.get('/login', (req, res) => {
    if (req.session.studentId) return res.redirect('/home');
    if (req.session.isTeacher) return res.redirect('/dashboard');

    res.render('login', { title: "Login", error: null });
});

app.get('/home', requireLogin, (req, res) => {
    res.render('home', { title: 'Home', username: req.session.username });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Teacher hardcoded login (change these)
  if (username === 'teacher' && password === 'teacherpassword') {
    req.session.isTeacher = true;
    return res.redirect('/dashboard');
  }

  const student = db.prepare('SELECT * FROM students WHERE username = ?').get(username);
  if (!student || !bcrypt.compareSync(password, student.password)) {
    return res.render('login', { title: 'Login', error: 'Invalid username or password' });
  }

  req.session.studentId = student.id;
  req.session.username = student.username;
  res.redirect('/home');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/dashboard', requireTeacher, (req, res) => {
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

app.get('/exercises', requireLogin, (req, res) => {
    const exercises = db.prepare('SELECT * FROM exercises').all();
    res.render('exercises', {title: 'Exercises', exercises});
});

app.get('/exercises/:id', requireLogin, (req, res) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) return res.status(404).send('Exercise not found');
  res.render('editor', { title: exercise.title, exercise });
});

app.post('/submit/:exerciseId', requireLogin, (req, res) => {
  const { code } = req.body;
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  // Placeholder — you'll add real checks here later
  const passed = false;

  db.prepare(`
    INSERT INTO submissions (student_id, exercise_id, code, passed)
    VALUES (?, ?, ?, ?)
  `).run(req.session.studentId, exercise.id, code, passed ? 1 : 0);

  res.json({ passed, feedback: 'Submitted!' });
});

app.post('/hint', requireLogin, async (req, res) => {
    const { code, exerciseDescription } = req.body;
    console.log("started thinking...")
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `
        You are a friendly Python tutor helping a beginner student.
        The exercise is "${exerciseDescription}"

        The student's current code is:
            \`\`\`python
            ${code}
            \`\`\`
      
      Give a short hint that guides them without giving away the full answer.
      - If their code is empty or barely started, give a gentle nudge on where to begin.
      - If they're close, point out specifically what's missing or wrong.
      - Use code examples only if really necessary, and keep them partial/incomplete.
      - Keep it to 2-3 sentences max.
      - Use markdown formatting.
        `
    });
    // const response = {text: "test lol"}
    console.log("Done!")
    console.log(response.text)
    res.json({hint: response.text});
});


// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-3.5-flash",
//     contents: "Explain how AI works in a few words",
//   });

//   console.log(response.text);
// }

// main();



app.listen(port, () => {
  console.log(`Example app listening on port... ${port}`);
});