const express = require('express');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { student_id, title, description, category_id, difficulty, coins_reward, exp_reward, due_date, repeat_type } = req.body;
  if (!student_id || !title) return res.status(400).json({ error: '请填写任务标题' });
  var sql = "INSERT INTO tasks (student_id, creator_id, title, description, category_id, difficulty, coins_reward, exp_reward, due_date, repeat_type, status) VALUES (?,?,?,?,?,?,?,?,?,?,'active')";
  const result = db.prepare(sql).run(student_id, req.user.id, title, description || '', category_id || null, difficulty || 'medium', coins_reward || 10, exp_reward || 10, due_date || null, repeat_type || 'none');
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.json(task);
});

router.get('/my', authMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.status(404).json({ error: '学生信息不存在' });
  const tasks = db.prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM tasks t LEFT JOIN task_categories c ON t.category_id = c.id WHERE t.student_id = ? ORDER BY t.status ASC, t.created_at DESC").all(student.id);
  const submissions = db.prepare('SELECT * FROM task_submissions WHERE student_id = ?').all(student.id);
  res.json({ tasks, submissions });
});

router.get('/student/:studentUserId', authMiddleware, adminOnly, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(parseInt(req.params.studentUserId));
  if (!student) return res.status(404).json({ error: '学生不存在' });
  const tasks = db.prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM tasks t LEFT JOIN task_categories c ON t.category_id = c.id WHERE t.student_id = ? ORDER BY t.created_at DESC").all(student.id);
  res.json({ tasks, student });
});

router.post('/:id/submit', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  if (task.student_id !== student.id) return res.status(403).json({ error: '无权操作' });
  const { proof_text } = req.body;
  db.prepare("UPDATE tasks SET status = 'pending' WHERE id = ?").run(task.id);
  db.prepare("INSERT INTO task_submissions (task_id, student_id, status, proof_text) VALUES (?,?,'pending',?)").run(task.id, student.id, proof_text || '');
  res.json({ message: '提交成功，等待审核' });
});

router.post('/:id/review', authMiddleware, adminOnly, (req, res) => {
  const { status, comment } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: '状态错误' });
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (status === 'approved') {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(task.student_id);
    const newExp = student.pet_exp + task.exp_reward;
    const newCoins = student.coins + task.coins_reward;
    const levelConfig = db.prepare('SELECT * FROM pet_levels WHERE exp_required <= ? ORDER BY exp_required DESC').get(newExp);
    const newLevel = levelConfig ? levelConfig.level : student.pet_level;
    db.prepare('UPDATE students SET pet_exp=?, pet_level=?, coins=?, total_coins_earned=total_coins_earned+?, total_tasks_done=total_tasks_done+1 WHERE id=?').run(newExp, Math.max(newLevel, student.pet_level), newCoins, task.coins_reward, student.id);
    db.prepare("UPDATE tasks SET status='completed', completed_at=datetime('now','localtime') WHERE id=?").run(task.id);
    const sid = db.prepare('SELECT user_id FROM students WHERE id=?').get(task.student_id).user_id;
    db.prepare('INSERT INTO notifications (user_id, title, content) VALUES (?,?,?)').run(sid, '任务通过审核', '你的任务「' + task.title + '」已通过，获得 ' + task.coins_reward + ' 金币和 ' + task.exp_reward + ' 经验！');
  } else {
    db.prepare("UPDATE tasks SET status='active' WHERE id=?").run(task.id);
    const sid = db.prepare('SELECT user_id FROM students WHERE id=?').get(task.student_id).user_id;
    db.prepare('INSERT INTO notifications (user_id, title, content) VALUES (?,?,?)').run(sid, '任务未通过', '你的任务「' + task.title + '」未通过审核，请重新提交。' + (comment ? ' 老师留言：' + comment : ''));
  }
  db.prepare("UPDATE task_submissions SET status=?, admin_comment=?, reviewed_at=datetime('now','localtime') WHERE task_id=?").run(status, comment || '', task.id);
  res.json({ message: status === 'approved' ? '已通过' : '已拒绝' });
});

router.get('/categories', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM task_categories').all());
});

module.exports = router;
