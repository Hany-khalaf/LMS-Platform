const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'schoolhub.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student'
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      specialty TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      level TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      teacher_id INTEGER,
      day TEXT,
      time TEXT,
      duration INTEGER DEFAULT 60,
      room TEXT,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id)
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@school.com');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('School Admin', 'admin@school.com', 'admin123', 'admin');
  }

  const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
  if (teacherCount === 0) {
    db.prepare(`
      INSERT INTO teachers (name, email, phone, specialty)
      VALUES
        ('Mr. Ali Hassan', 'ali@school.com', '+966500111222', 'Mathematics'),
        ('Mrs. Sara Ahmed', 'sara@school.com', '+966500111223', 'Science'),
        ('Mr. Omar Salem', 'omar@school.com', '+966500111224', 'Languages')
    `).run();
  }

  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  if (studentCount === 0) {
    db.prepare(`
      INSERT INTO students (name, email, phone, level)
      VALUES
        ('Noura Ali', 'noura@mail.com', '+966500100001', 'Beginner'),
        ('Yousef Khalid', 'yousef@mail.com', '+966500100002', 'Intermediate'),
        ('Mona Salem', 'mona@mail.com', '+966500100003', 'Advanced'),
        ('Hassan Noor', 'hassan@mail.com', '+966500100004', 'Intermediate'),
        ('Lina Omar', 'lina@mail.com', '+966500100005', 'Beginner')
    `).run();
  }

  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;
  if (lessonCount === 0) {
    db.prepare(`
      INSERT INTO lessons (title, description, teacher_id, day, time, duration, room)
      VALUES
        ('Algebra Basics', 'Learn equations, variables, and problem solving.', 1, 'Monday', '09:00', 90, 'Room A1'),
        ('Biology Lab', 'Hands-on experiments and learning science concepts.', 2, 'Wednesday', '11:00', 60, 'Lab 2'),
        ('English Conversation', 'Practice speaking and writing in daily life.', 3, 'Friday', '14:00', 60, 'Room B3')
    `).run();
  }
}

initDatabase();

app.get('/api/dashboard', (req, res) => {
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;

  res.json({
    studentCount,
    teacherCount,
    lessonCount,
    adminUser: {
      name: 'School Admin',
      email: 'admin@school.com',
      role: 'admin'
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?').get(email, password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/api/students', (req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/students', (req, res) => {
  const { name, email, phone, level } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const insert = db.prepare(`
    INSERT INTO students (name, email, phone, level)
    VALUES (?, ?, ?, ?)
  `);

  const result = insert.run(name, email, phone || '', level || 'Beginner');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Student added successfully.' });
});

app.delete('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  res.json({ message: 'Student removed successfully.' });
});

app.get('/api/teachers', (req, res) => {
  const rows = db.prepare('SELECT * FROM teachers ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/teachers', (req, res) => {
  const { name, email, phone, specialty } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Teacher name is required.' });
  }

  const insert = db.prepare(`
    INSERT INTO teachers (name, email, phone, specialty)
    VALUES (?, ?, ?, ?)
  `);

  const result = insert.run(name, email || '', phone || '', specialty || 'General');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Teacher added successfully.' });
});

app.delete('/api/teachers/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
  res.json({ message: 'Teacher removed successfully.' });
});

app.get('/api/lessons', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, t.name as teacher_name
    FROM lessons l
    LEFT JOIN teachers t ON t.id = l.teacher_id
    ORDER BY l.id DESC
  `).all();
  res.json(rows);
});

app.post('/api/lessons', (req, res) => {
  const { title, description, teacher_id, day, time, duration, room } = req.body;

  if (!title || !day || !time) {
    return res.status(400).json({ message: 'Lesson title, day, and time are required.' });
  }

  const insert = db.prepare(`
    INSERT INTO lessons (title, description, teacher_id, day, time, duration, room)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(title, description || '', teacher_id || null, day, time, duration || 60, room || 'Main Room');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Lesson added successfully.' });
});

app.delete('/api/lessons/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM lessons WHERE id = ?').run(id);
  res.json({ message: 'Lesson removed successfully.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SchoolHub Admin app is running on http://localhost:${PORT}`);
});
