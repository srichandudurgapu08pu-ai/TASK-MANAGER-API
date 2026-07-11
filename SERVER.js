// Task API — a small Express REST API with JSON-file persistence.
// Endpoints:
//   GET    /api/tasks            -> list all tasks (supports ?status=, ?priority=, ?search=)
//   GET    /api/tasks/:id        -> get one task
//   POST   /api/tasks            -> create a task
//   PUT    /api/tasks/:id        -> replace/update a task
//   PATCH  /api/tasks/:id/toggle -> toggle a task's done status
//   DELETE /api/tasks/:id        -> delete a task
//   GET    /api/stats            -> summary counts

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- persistence helpers ----------

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const seed = [
      mkTask('Set up project repo', 'high', false),
      mkTask('Design the database schema', 'medium', false),
      mkTask('Write the README', 'low', true),
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
  }
}

function mkTask(title, priority = 'medium', done = false) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    priority, // 'low' | 'medium' | 'high'
    done,
    createdAt: now,
    updatedAt: now,
  };
}

function readTasks() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// ---------- validation ----------

const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTitle(title) {
  return typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 200;
}

// ---------- routes ----------

app.get('/api/tasks', (req, res) => {
  let tasks = readTasks();
  const { status, priority, search } = req.query;

  if (status === 'done') tasks = tasks.filter(t => t.done);
  if (status === 'pending') tasks = tasks.filter(t => !t.done);

  if (priority && VALID_PRIORITIES.includes(priority)) {
    tasks = tasks.filter(t => t.priority === priority);
  }

  if (search) {
    const q = search.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q));
  }

  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ count: tasks.length, tasks });
});

app.get('/api/stats', (req, res) => {
  const tasks = readTasks();
  res.json({
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    pending: tasks.filter(t => !t.done).length,
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
  });
});

app.get('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title, priority } = req.body;
  if (!validateTitle(title)) {
    return res.status(400).json({ error: 'Title is required and must be 1-200 characters' });
  }
  const p = VALID_PRIORITIES.includes(priority) ? priority : 'medium';
  const tasks = readTasks();
  const task = mkTask(title.trim(), p, false);
  tasks.push(task);
  writeTasks(tasks);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const { title, priority, done } = req.body;
  if (title !== undefined && !validateTitle(title)) {
    return res.status(400).json({ error: 'Title must be 1-200 characters' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Priority must be low, medium, or high' });
  }

  const task = tasks[idx];
  if (title !== undefined) task.title = title.trim();
  if (priority !== undefined) task.priority = priority;
  if (done !== undefined) task.done = !!done;
  task.updatedAt = new Date().toISOString();

  tasks[idx] = task;
  writeTasks(tasks);
  res.json(task);
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  tasks[idx].done = !tasks[idx].done;
  tasks[idx].updatedAt = new Date().toISOString();
  writeTasks(tasks);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const [removed] = tasks.splice(idx, 1);
  writeTasks(tasks);
  res.json({ deleted: removed });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
  console.log(`Demo UI at        http://localhost:${PORT}/`);
});
