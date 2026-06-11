import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, apiFetch, logout } = useAuth();
  const nav = useNavigate();
  var [students, setStudents] = useState([]);
  var [selectedStudent, setSelectedStudent] = useState(null);
  var [tasks, setTasks] = useState([]);
  var [pendingSubmissions, setPendingSubmissions] = useState([]);
  var [showAddTask, setShowAddTask] = useState(false);
  var [categories, setCategories] = useState([]);
  var [tab, setTab] = useState('students');
  var [taskForm, setTaskForm] = useState({ title:'', description:'', category_id:'', difficulty:'medium', coins_reward:10, exp_reward:10 });

  var loadStudents = useCallback(async function() {
    try { setStudents(await apiFetch('/students')); setCategories(await apiFetch('/tasks/categories')); }
    catch(e) { console.error(e); }
  }, [apiFetch]);

  useEffect(function() { loadStudents(); }, [loadStudents]);

  var loadStudentTasks = async function(studentUserId) {
    try {
      var data = await apiFetch('/tasks/student/' + studentUserId);
      setTasks(data.tasks);
      setSelectedStudent(data.student);
      setPendingSubmissions(data.tasks.filter(function(t) { return t.status === 'pending'; }));
    } catch(e) { console.error(e); }
  };

  var handleCreateTask = async function() {
    if (!selectedStudent || !taskForm.title) return;
    try {
      await apiFetch('/tasks', { method:'POST', body:JSON.stringify({ ...taskForm, student_id: selectedStudent.id, category_id: taskForm.category_id ? parseInt(taskForm.category_id) : null }) });
      setShowAddTask(false);
      setTaskForm({ title:'', description:'', category_id:'', difficulty:'medium', coins_reward:10, exp_reward:10 });
      loadStudentTasks(selectedStudent.user_id);
    } catch(e) { alert(e.message); }
  };

  var handleReview = async function(taskId, status) {
    var comment = status === 'rejected' ? prompt('请输入拒审原因：') : '';
    try { await apiFetch('/tasks/' + taskId + '/review', { method:'POST', body:JSON.stringify({ status, comment }) }); loadStudentTasks(selectedStudent.user_id); }
    catch(e) { alert(e.message); }
  };

  var emojis = ['🥚','🐣','🐤','🐥','🐰','🦊','🐱','🦋','🦄','🐉'];
  var getEmoji = function(lvl) { return emojis[Math.min(lvl - 1, 9)] || '🐣'; };

  if (!user || user.role !== 'admin') return nav('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-xl font-bold">📚 管理后台</h1><p className="text-indigo-200 text-sm">班主任 {user.nickname}</p></div>
        <div className="flex items-center gap-2">
          <button onClick={function() { nav('/home'); }} className="text-sm bg-indigo-500 px-3 py-1 rounded-lg hover:bg-indigo-400 transition">学生视图</button>
          <button onClick={function() { logout(); nav('/login'); }} className="text-sm text-indigo-200 hover:text-white">退出</button>
        </div>
      </div>
      
      <div className="bg-white border-b flex">
        {[{key:'students', label:'👥 学生管理'},{key:'reports', label:'📊 数据统计'}].map(function(item) { return (
          <button key={item.key} onClick={function() { setTab(item.key); }}
            className={'flex-1 py-3 text-sm font-medium border-b-2 transition ' + (tab === item.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500')}>{item.label}</button>
        ); })}
      </div>
      
      <div className="p-4 max-w-6xl mx-auto">
        {tab === 'students' && <div className="grid md:grid-cols-[300px_1fr] gap-4">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-3 border-b font-medium text-sm">学生列表 ({students.length})</div>
            <div className="divide-y max-h-[70vh] overflow-y-auto">
              {students.map(function(s) { return (
                <button key={s.id} onClick={function() { loadStudentTasks(s.user_id); }}
                  className={'w-full p-3 text-left hover:bg-indigo-50 transition flex items-center gap-3 ' + (selectedStudent && selectedStudent.user_id === s.user_id ? 'bg-indigo-50 border-l-4 border-indigo-600' : '')}>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">{s.nickname[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.nickname}</p>
                    <p className="text-xs text-gray-400">完成 {s.total_tasks_done} 项 | Lv.{s.pet_level}</p>
                  </div>
                  <span className="text-xs text-gray-400">🪙{s.coins}</span>
                </button>
              ); })}
              {students.length === 0 && <p className="p-4 text-gray-400 text-sm text-center">暂无学生</p>}
            </div>
          </div>
          
          <div>
            {selectedStudent ? <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl">{getEmoji(selectedStudent.pet_level)}</div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedStudent.pet_name}</h3>
                    <p className="text-sm text-gray-500">Lv.{selectedStudent.pet_level} | 连续 {selectedStudent.streak_days} 天</p>
                    <div className="flex gap-4 mt-1 text-sm"><span>❤️ {selectedStudent.pet_health}%</span><span>😊 {selectedStudent.pet_happiness}%</span><span>🪙 {selectedStudent.coins}</span></div>
                  </div>
                </div>
              </div>
              
              {pendingSubmissions.length > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-medium text-yellow-800 mb-2">📬 待审核 ({pendingSubmissions.length})</h4>
                {pendingSubmissions.map(function(t) { return (
                  <div key={t.id} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2 border border-yellow-100">
                    <div><p className="font-medium text-sm">{t.title}</p><p className="text-xs text-gray-500">学生已提交完成</p></div>
                    <div className="flex gap-2">
                      <button onClick={function() { handleReview(t.id, 'approved'); }} className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition">✅ 通过</button>
                      <button onClick={function() { handleReview(t.id, 'rejected'); }} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition">❌ 驳回</button>
                    </div>
                  </div>
                ); })}
              </div>}
              
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="font-medium text-sm">📋 任务列表</span>
                  <button onClick={function() { setShowAddTask(true); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">+ 布置新任务</button>
                </div>
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {tasks.length === 0 ? <p className="p-4 text-gray-400 text-sm text-center">暂无任务</p>
                  : tasks.map(function(task) {
                    var statusMap = { pending:'待审核', active:'待完成', completed:'已完成', expired:'已过期' };
                    var colorMap = { pending:'text-yellow-600', active:'text-blue-600', completed:'text-green-600', expired:'text-gray-400' };
                    return <div key={task.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {task.category_icon && <span>{task.category_icon}</span>}
                          <span className="text-sm font-medium">{task.title}</span>
                          <span className={'text-xs ' + (colorMap[task.status] || '')}>({statusMap[task.status] || task.status})</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">🪙 +{task.coins_reward} | ⭐ +{task.exp_reward}{task.created_at && ' | ' + task.created_at}</div>
                      </div>
                    </div>;
                  })}
                </div>
              </div>
              
              {showAddTask && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={function() { setShowAddTask(false); }}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn" onClick={function(e) { e.stopPropagation(); }}>
                  <h3 className="font-bold text-lg mb-4">布置新任务</h3>
                  <div className="space-y-3">
                    <div><label className="text-sm text-gray-600">任务标题 *</label>
                      <input value={taskForm.title} onChange={function(e) { setTaskForm({...taskForm, title:e.target.value}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="如：完成数学练习册第3单元" /></div>
                    <div><label className="text-sm text-gray-600">描述</label>
                      <textarea value={taskForm.description} onChange={function(e) { setTaskForm({...taskForm, description:e.target.value}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" rows={2} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm text-gray-600">科目</label>
                        <select value={taskForm.category_id} onChange={function(e) { setTaskForm({...taskForm, category_id:e.target.value}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none">
                          <option value="">不限</option>{categories.map(function(c) { return <option key={c.id} value={c.id}>{c.icon} {c.name}</option>; })}</select></div>
                      <div><label className="text-sm text-gray-600">难度</label>
                        <select value={taskForm.difficulty} onChange={function(e) { setTaskForm({...taskForm, difficulty:e.target.value}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none">
                          <option value="easy">简单</option><option value="medium">中等</option><option value="hard">困难</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm text-gray-600">金币奖励</label>
                        <input type="number" value={taskForm.coins_reward} onChange={function(e) { setTaskForm({...taskForm, coins_reward:parseInt(e.target.value) || 0}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" /></div>
                      <div><label className="text-sm text-gray-600">经验奖励</label>
                        <input type="number" value={taskForm.exp_reward} onChange={function(e) { setTaskForm({...taskForm, exp_reward:parseInt(e.target.value) || 0}); }} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={function() { setShowAddTask(false); }} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleCreateTask} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">发布任务</button>
                    </div>
                  </div>
                </div>
              </div>}
            </div> : <div className="bg-white rounded-xl p-8 text-center text-gray-400 border">
              <span className="text-5xl block mb-4">👈</span><p>请从左侧选择一个学生</p>
            </div>}
          </div>
        </div>}
        
        {tab === 'reports' && <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-gray-500 text-sm">👥 学生总数</p><p className="text-3xl font-bold mt-1">{students.length}</p></div>
            <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-gray-500 text-sm">📋 总任务完成数</p><p className="text-3xl font-bold mt-1">{students.reduce(function(a, s) { return a + s.total_tasks_done; }, 0)}</p></div>
            <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-gray-500 text-sm">🏆 平均等级</p><p className="text-3xl font-bold mt-1">{students.length ? (students.reduce(function(a, s) { return a + s.pet_level; }, 0) / students.length).toFixed(1) : 0}</p></div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h4 className="font-bold mb-3">🏆 学生排行榜</h4>
            <div className="space-y-2">
              {[...students].sort(function(a,b) { return b.total_tasks_done - a.total_tasks_done; }).map(function(s, i) { return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' + (i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400')}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">{s.nickname[0]}</div>
                  <div className="flex-1"><p className="font-medium text-sm">{s.nickname}</p><p className="text-xs text-gray-400">Lv.{s.pet_level} · 完成 {s.total_tasks_done} 项</p></div>
                  <span className="text-sm font-bold text-indigo-600">{s.total_tasks_done} 项</span>
                </div>
              ); })}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
