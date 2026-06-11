const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: '密码错误' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, nickname: user.nickname }, SECRET, { expiresIn: '7d' });
  let student = null;
  if (user.role === 'student') {
    student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  }
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, nickname: user.nickname, avatar: user.avatar }, student });
});

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password || !nickname) return res.status(400).json({ error: '请填写完整信息' });
  const exist = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exist) return res.status(400).json({ error: '用户名已存在' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role, nickname) VALUES (?,?,?,?)').run(username, hash, 'student', nickname);
  db.prepare('INSERT INTO students (user_id, pet_name) VALUES (?,?)').run(result.lastInsertRowid, nickname + '的宠物');
  const user = db.prepare('SELECT id, username, role, nickname FROM users WHERE id = ?').get(result.lastInsertRowid);
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, nickname: user.nickname }, SECRET, { expiresIn: '7d' });
  res.json({ token, user, student });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, role, nickname, avatar FROM users WHERE id = ?').get(req.user.id);
  let student = null;
  if (user.role === 'student') {
    student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  }
  res.json({ user, student });
});

module.exports = router;
