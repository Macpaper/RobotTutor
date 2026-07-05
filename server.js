require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const lessons = require('./data/lessons');

const session = require('express-session');
const ejsLayouts = require('express-ejs-layouts');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const { router: authRouter, requireLigin, requireTeacher } = require('./routes/auth');

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(ejsLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// not sure what this is either yet
app.use(session({
    secret: process.env.SESSION_SECRET || '75acf83c4d6309283c8363ca43b4f4886f7e8636b8772177d62cb0c3cffd5966',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.studentId = req.session.studentId || null;
    res.locals.isTeacher = req.session.isTeacher || false;
    res.locals.username = req.session.username || null;
    next();
});

app.get('/', (req, res) => { res.redirect('/login'); });

app.use(authRouter);
app.use(require('./routes/exercises'));

app.get('/lessons', requireLogin, (req, res) => {
    res.render('lessons', { title: 'Lessons' });
})

app.get('/lessons/:id', requireLogin, (req, res) => {
    const lesson = lessons.find(l => l.id === parseInt(req.params.id));
    if (!lesson) return res.status(404).send('Lesson not found');
    res.render(`lessons/${req.params.id}`, { title: lesson.title });
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
    console.log("Done!")
    console.log(response.text)
    res.json({hint: response.text});
});

app.listen(port, () => {
  console.log(`Example app listening on port... ${port}`);
});