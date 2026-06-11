const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/my', authMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  if (!student) return res.status(404).json({ error: '学生不存在' });
  const levelConfig = db.prepare('SELECT * FROM pet_levels WHERE level = ?').get(student.pet_level);
  const nextLevel = db.prepare('SELECT * FROM pet_levels WHERE level = ?').get(student.pet_level + 1);
  const items = db.prepare('SELECT si.*, s.name, s.description, s.icon, s.type, s.effect_type, s.effect_value FROM student_items si JOIN shop_items s ON si.item_id = s.id WHERE si.student_id = ?').all(student.id);
  res.json({ student, levelConfig, nextLevel, items });
});

router.post('/use-item', authMiddleware, (req, res) => {
  const { item_id } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  const item = db.prepare('SELECT * FROM student_items WHERE student_id=? AND item_id=? AND quantity>0').get(student.id, item_id);
  if (!item) return res.status(400).json({ error: '物品不足' });
  const shopItem = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(item_id);
  let h = student.pet_happiness, he = student.pet_health;
  if (shopItem.effect_type === 'happiness') h = Math.min(100, h + shopItem.effect_value);
  else if (shopItem.effect_type === 'health') he = Math.min(100, he + shopItem.effect_value);
  db.prepare('UPDATE student_items SET quantity = quantity - 1 WHERE student_id=? AND item_id=?').run(student.id, item_id);
  db.prepare('UPDATE students SET pet_happiness=?, pet_health=? WHERE id=?').run(h, he, student.id);
  res.json({ message: '使用成功', pet_happiness: h, pet_health: he });
});

router.get('/shop', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM shop_items').all());
});

router.post('/buy', authMiddleware, (req, res) => {
  const { item_id } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(item_id);
  if (!item) return res.status(400).json({ error: '商品不存在' });
  if (student.coins < item.price) return res.status(400).json({ error: '金币不足' });
  db.prepare('UPDATE students SET coins = coins - ? WHERE id=?').run(item.price, student.id);
  const existing = db.prepare('SELECT * FROM student_items WHERE student_id=? AND item_id=?').get(student.id, item_id);
  if (existing) {
    db.prepare('UPDATE student_items SET quantity = quantity + 1 WHERE id=?').run(existing.id);
  } else {
    db.prepare('INSERT INTO student_items (student_id, item_id, quantity) VALUES (?,?,1)').run(student.id, item_id);
  }
  res.json({ message: '购买成功', coins_left: student.coins - item.price });
});

router.post('/checkin', authMiddleware, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  const today = new Date().toISOString().split('T')[0];
  if (student.last_active_date === today) return res.json({ message: '今天已签到', student });
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = student.last_active_date === yesterday ? student.streak_days + 1 : 1;
  const bonus = Math.min(newStreak * 2, 20);
  db.prepare('UPDATE students SET coins=coins+?, pet_happiness=MIN(100,pet_happiness+5), pet_exp=pet_exp+?, streak_days=?, last_active_date=? WHERE id=?').run(5 + bonus, 5 + bonus, newStreak, today, student.id);
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id);
  res.json({ message: '签到成功！', bonus, streak: newStreak, student: updated });
});

module.exports = router;
