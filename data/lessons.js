// data/lessons.js
const lessons = [
  {
    id: 1,
    title: 'Introduction to Python',
    description: 'Learn the basics of Python programming, including syntax, variables, and data types.',
    exercises: [1, 2, 3]  // exercise IDs from your DB that belong to this lesson
  },
  {
    id: 2,
    title: 'Control Structures',
    description: 'Understand how to use if statements, loops, and functions.',
    exercises: [4, 5, 6]
  },
  {
    id: 3,
    title: 'Data Structures',
    description: 'Explore lists, dictionaries, sets, and tuples.',
    exercises: [7, 8]
  },
  // ...
];

module.exports = lessons;