const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'pet_system.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables using regular strings  
const createUsers = "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),nickname TEXT NOT NULL,avatar TEXT DEFAULT '',created_at DATETIME DEFAULT (datetime('now','localtime')))";
const createStudents = "CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),pet_name TEXT DEFAULT '小豆豆',pet_type TEXT DEFAULT 'egg',pet_level INTEGER DEFAULT 1,pet_exp INTEGER DEFAULT 0,pet_happiness INTEGER DEFAULT 70,pet_health INTEGER DEFAULT 80,coins INTEGER DEFAULT 0,streak_days INTEGER DEFAULT 0,total_coins_earned INTEGER DEFAULT 0,total_tasks_done INTEGER DEFAULT 0,last_active_date TEXT DEFAULT '',created_at DATETIME DEFAULT (datetime('now','localtime')))";
const createCategories = "CREATE TABLE IF NOT EXISTS task_categories (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,icon TEXT DEFAULT '📚',color TEXT DEFAULT '#6366f1')";
const createTasks = "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL REFERENCES students(id),creator_id INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,description TEXT DEFAULT '',category_id INTEGER REFERENCES task_categories(id),difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),coins_reward INTEGER DEFAULT 10,exp_reward INTEGER DEFAULT 10,due_date TEXT,repeat_type TEXT DEFAULT 'none' CHECK(repeat_type IN ('none','daily','weekly')),status TEXT DEFAULT 'active' CHECK(status IN ('pending','active','completed','expired')),created_at DATETIME DEFAULT (datetime('now','localtime')),completed_at DATETIME)";
const createSubmissions = "CREATE TABLE IF NOT EXISTS task_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER NOT NULL REFERENCES tasks(id),student_id INTEGER NOT NULL REFERENCES students(id),status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),proof_text TEXT DEFAULT '',admin_comment TEXT DEFAULT '',submitted_at DATETIME DEFAULT (datetime('now','localtime')),reviewed_at DATETIME)";
const createShop = "CREATE TABLE IF NOT EXISTS shop_items (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT DEFAULT '',price INTEGER DEFAULT 50,type TEXT DEFAULT 'food' CHECK(type IN ('food','toy','decor','accessory')),effect_type TEXT DEFAULT 'happiness',effect_value INTEGER DEFAULT 10,icon TEXT DEFAULT '🍎')";
const createStudentItems = "CREATE TABLE IF NOT EXISTS student_items (id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL REFERENCES students(id),item_id INTEGER NOT NULL REFERENCES shop_items(id),quantity INTEGER DEFAULT 1)";
const createNotifs = "CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,content TEXT DEFAULT '',type TEXT DEFAULT 'system',is_read INTEGER DEFAULT 0,created_at DATETIME DEFAULT (datetime('now','localtime')))";
const createLevels = "CREATE TABLE IF NOT EXISTS pet_levels (level INTEGER PRIMARY KEY,exp_required INTEGER DEFAULT 0,name TEXT DEFAULT '',description TEXT DEFAULT '')";

[createUsers, createStudents, createCategories, createTasks, createSubmissions, createShop, createStudentItems, createNotifs, createLevels].forEach(s => db.exec(s));

// Seed categories
if (db.prepare('SELECT COUNT(*) as c FROM task_categories').get().c === 0) {
  const ins = db.prepare('INSERT INTO task_categories (name, icon, color) VALUES (?,?,?)');
  [['语文作业','📖','#6366f1'],['数学作业','🔢','#ef4444'],['英语作业','🔤','#22c55e'],['科学作业','🔬','#f59e0b'],['阅读打卡','📕','#8b5cf6'],['运动打卡','🏃','#06b6d4'],['家务劳动','🧹','#ec4899']].forEach(c => ins.run(c[0],c[1],c[2]));
}
if (db.prepare('SELECT COUNT(*) as c FROM pet_levels').get().c === 0) {
  const ins = db.prepare('INSERT INTO pet_levels (level, exp_required, name, description) VALUES (?,?,?,?)');
  [[1,0,'🥚 蛋','新出生的宠物蛋'],[2,30,'🐣 孵化','破壳而出啦'],[3,80,'🐤 幼年','开始认主人了'],[4,150,'🐥 成长','茁壮成长中'],[5,250,'🐰 活泼','活泼好动'],[6,400,'🦊 机灵','越来越聪明'],[7,600,'🐱 优雅','变得优雅'],[8,900,'🦋 进化','完成了进化'],[9,1300,'🦄 闪耀','散发着光芒'],[10,2000,'🐉 传说','传说中的神兽']].forEach(l => ins.run(l[0],l[1],l[2],l[3]));
}
if (db.prepare('SELECT COUNT(*) as c FROM shop_items').get().c === 0) {
  const ins = db.prepare('INSERT INTO shop_items (name, description, price, type, effect_type, effect_value, icon) VALUES (?,?,?,?,?,?,?)');
  [['小饼干','补充体力',30,'food','health',15,'🍪'],['糖果','开心起来',25,'food','happiness',15,'🍬'],['毛线球','一起玩耍',40,'toy','happiness',25,'🧶'],['小铃铛','挂饰',50,'accessory','happiness',10,'🔔'],['软垫子','温暖小窝',60,'decor','health',20,'🛏️'],['营养餐','营养大餐',45,'food','health',25,'🥗'],['小帽子','可爱帽子',70,'accessory','happiness',20,'🧢'],['水果拼盘','新鲜水果',35,'food','health',18,'🍉']].forEach(i => ins.run(i[0],i[1],i[2],i[3],i[4],i[5],i[6]));
}
if (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get().c === 0) {
  const bcrypt = require('bcryptjs');
  db.prepare('INSERT INTO users (username, password, role, nickname) VALUES (?,?,?,?)').run('admin', bcrypt.hashSync('admin123', 10), 'admin', '班主任');
}
module.exports = db;
