import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PetDisplay = ({ student, levelConfig, nextLevel, onFeed, items }) => {
  var emojis = ['🥚','🐣','🐤','🐥','🐰','🦊','🐱','🦋','🦄','🐉'];
  var petEmoji = emojis[Math.min(student.pet_level - 1, 9)] || '🐣';
  var healthColor = student.pet_health >= 70 ? 'bg-green-500' : student.pet_health >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  var happyColor = student.pet_happiness >= 70 ? 'bg-green-500' : student.pet_happiness >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  var expPercent = nextLevel ? Math.min((student.pet_exp / nextLevel.exp_required) * 100, 100) : 100;
  var shakeClass = student.pet_happiness < 30 ? ' animate-shake' : '';
  
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg mt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold">{student.pet_name}</h2>
          <p className="text-indigo-200 text-sm">{levelConfig ? levelConfig.name : 'Lv.' + student.pet_level}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-300"><span>🪙</span><span className="font-bold text-lg">{student.coins}</span></div>
          <p className="text-indigo-200 text-xs">连续 {student.streak_days} 天</p>
        </div>
      </div>
      <div className="flex justify-center py-3">
        <div className={'text-8xl animate-float' + shakeClass}>{petEmoji}</div>
      </div>
      <div className="space-y-2">
        <div><div className="flex justify-between text-xs mb-1"><span>❤️ 健康</span><span>{student.pet_health}%</span></div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className={'h-full ' + healthColor + ' rounded-full transition-all duration-500'} style={{width: student.pet_health + '%'}} /></div></div>
        <div><div className="flex justify-between text-xs mb-1"><span>😊 心情</span><span>{student.pet_happiness}%</span></div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className={'h-full ' + happyColor + ' rounded-full transition-all duration-500'} style={{width: student.pet_happiness + '%'}} /></div></div>
        <div><div className="flex justify-between text-xs mb-1"><span>⭐ 经验</span><span>{student.pet_exp}/{nextLevel ? nextLevel.exp_required : 'MAX'}</span></div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{width: expPercent + '%'}} /></div></div>
      </div>
      {items && items.length > 0 && <div className="grid grid-cols-3 gap-2 mt-3">
        {items.slice(0, 6).map(item => (
          <button key={item.id} onClick={() => onFeed(item.item_id)}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 text-center text-xs transition active:scale-95">
            <span className="text-lg block">{item.icon}</span>
            <span className="truncate block">{item.name}</span>
            <span className="text-indigo-200">x{item.quantity}</span>
          </button>
        ))}
      </div>}
    </div>
  );
};

const TaskCard = ({ task, onComplete }) => {
  var labels = { pending:'待审核', active:'待完成', completed:'已完成', expired:'已过期' };
  var colors = { pending:'bg-yellow-100 text-yellow-700', active:'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700', expired:'bg-gray-100 text-gray-500' };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {task.category_icon && <span className="text-lg">{task.category_icon}</span>}
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            <span className={'text-xs px-2 py-0.5 rounded-full ' + (colors[task.status] || colors.active)}>{labels[task.status] || '待完成'}</span>
          </div>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>🪙 +{task.coins_reward}</span><span>⭐ +{task.exp_reward}</span>
            {task.due_date && <span>📅 {task.due_date}</span>}
          </div>
        </div>
      </div>
      {task.status === 'active' && <button onClick={() => onComplete(task.id)}
        className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition active:scale-[0.98]">提交完成</button>}
      {task.status === 'pending' && <p className="mt-2 text-xs text-yellow-600 text-center">⏳ 等待老师审核...</p>}
    </div>
  );
};

export default function StudentHome() {
  const { user, student: initialStudent, apiFetch, refreshStudent } = useAuth();
  const nav = useNavigate();
  var [petData, setPetData] = useState({ student: initialStudent || {pet_level:1,pet_exp:0,pet_happiness:70,pet_health:80,coins:0,streak_days:0,pet_name:'小豆豆',total_tasks_done:0}, levelConfig:null, nextLevel:null, items:[] });
  var [tasks, setTasks] = useState([]);
  var [shop, setShop] = useState([]);
  var [notifs, setNotifs] = useState([]);
  var [showShop, setShowShop] = useState(false);
  var [showNotifs, setShowNotifs] = useState(false);
  var [tab, setTab] = useState('tasks');
  var [message, setMessage] = useState('');

  var showMsg = function(msg) { setMessage(msg); setTimeout(function() { setMessage(''); }, 2500); };

  var loadData = useCallback(async function() {
    try {
      var p = await apiFetch('/pets/my');
      var t = await apiFetch('/tasks/my');
      var s = await apiFetch('/pets/shop');
      var n = await apiFetch('/notifications');
      setPetData(p); setTasks(t.tasks); setShop(s); setNotifs(n);
    } catch(e) { console.error(e); }
  }, [apiFetch]);

  useEffect(function() { loadData(); }, [loadData]);

  var handleCheckin = async function() {
    try {
      var res = await apiFetch('/pets/checkin', { method:'POST' });
      showMsg('签到成功！连续 ' + res.streak + ' 天，奖励 ' + res.bonus + ' 额外金币');
      refreshStudent(); loadData();
    } catch(e) { showMsg(e.message); }
  };

  var handleComplete = async function(taskId) {
    try {
      await apiFetch('/tasks/' + taskId + '/submit', { method:'POST', body:JSON.stringify({proof_text:'已完成'}) });
      showMsg('已提交，等待老师审核'); loadData();
    } catch(e) { showMsg(e.message); }
  };

  var handleUseItem = async function(itemId) {
    try {
      await apiFetch('/pets/use-item', { method:'POST', body:JSON.stringify({item_id: itemId}) });
      showMsg('使用成功！'); refreshStudent(); loadData();
    } catch(e) { showMsg(e.message); }
  };

  var handleBuy = async function(itemId) {
    try {
      var res = await apiFetch('/pets/buy', { method:'POST', body:JSON.stringify({item_id: itemId}) });
      showMsg('购买成功！剩余 ' + res.coins_left + ' 金币'); loadData();
    } catch(e) { showMsg(e.message); }
  };

  var unreadCount = notifs.filter(function(n) { return !n.is_read; }).length;
  
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto pb-24">
      <div className="bg-indigo-600 text-white px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center text-lg font-bold">{(user && user.nickname) ? user.nickname[0] : '?'}</div>
            <div>
              <p className="font-medium">{(user) ? user.nickname : ''}</p>
              <p className="text-indigo-200 text-xs">已完成 {petData.student.total_tasks_done || 0} 项任务</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={function() { setShowNotifs(true); }} className="relative p-2 hover:bg-indigo-500 rounded-lg transition">
              🔔
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button onClick={function() { nav('/login'); }} className="text-sm text-indigo-200 hover:text-white">退出</button>
          </div>
        </div>
        <PetDisplay student={petData.student} levelConfig={petData.levelConfig} nextLevel={petData.nextLevel} onFeed={handleUseItem} items={petData.items} />
      </div>

      <div className="px-4 -mt-3 relative z-10">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button onClick={handleCheckin} className="bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md transition active:scale-95">
            <span className="text-xl">✅</span><p className="text-xs mt-1 font-medium">每日签到</p>
          </button>
          <button onClick={function() { setShowShop(true); }} className="bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md transition active:scale-95">
            <span className="text-xl">🏪</span><p className="text-xs mt-1 font-medium">商店</p>
          </button>
          <button onClick={function() { setTab('tasks'); }} className="bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md transition active:scale-95">
            <span className="text-xl">📋</span><p className="text-xs mt-1 font-medium">任务</p>
          </button>
          <button onClick={function() { setTab('record'); }} className="bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md transition active:scale-95">
            <span className="text-xl">📊</span><p className="text-xs mt-1 font-medium">记录</p>
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {tab === 'tasks' && <React.Fragment>
          <h3 className="font-bold text-gray-800">📋 待完成任务 ({(tasks.filter(function(t) { return t.status !== 'completed'; }).length)})</h3>
          {tasks.filter(function(t) { return t.status !== 'completed'; }).length === 0
            ? <div className="text-center py-8 text-gray-400"><span className="text-4xl block mb-2">🎉</span><p>所有任务已完成！太棒了！</p></div>
            : tasks.filter(function(t) { return t.status !== 'completed'; }).map(function(task) { return <TaskCard key={task.id} task={task} onComplete={handleComplete} />; })}
        </React.Fragment>}

        {tab === 'record' && <React.Fragment>
          <h3 className="font-bold text-gray-800">✅ 已完成任务</h3>
          {tasks.filter(function(t) { return t.status === 'completed'; }).length === 0
            ? <div className="text-center py-8 text-gray-400"><span className="text-4xl block mb-2">📝</span><p>还没有完成的任务哦</p></div>
            : tasks.filter(function(t) { return t.status === 'completed'; }).map(function(task) { return (
                <div key={task.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-50 opacity-70">
                  <div className="flex items-center gap-2">
                    {task.category_icon && <span>{task.category_icon}</span>}
                    <span className="text-sm text-gray-600 line-through">{task.title}</span>
                    <span className="text-xs text-green-600 ml-auto">✅ 已完成</span>
                  </div>
                </div>
              ); })}
        </React.Fragment>}
      </div>

      {showShop && <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={function() { setShowShop(false); }}>
        <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slideUp" onClick={function(e) { e.stopPropagation(); }}>
          <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-lg">🏪 宠物商店</h3>
            <button onClick={function() { setShowShop(false); }} className="text-gray-400 text-xl">✕</button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-4">当前金币：<span className="text-yellow-500 font-bold">{petData.student.coins}</span> 🪙</p>
            <div className="grid grid-cols-2 gap-3">
              {shop.map(function(item) { return (
                <div key={item.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition">
                  <div className="text-3xl text-center mb-2">{item.icon}</div>
                  <h4 className="font-medium text-sm text-center">{item.name}</h4>
                  <p className="text-xs text-gray-400 text-center mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-yellow-500 text-sm font-bold">🪙 {item.price}</span>
                    <button onClick={function() { handleBuy(item.id); }}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition active:scale-95">购买</button>
                  </div>
                </div>
              ); })}
            </div>
          </div>
        </div>
      </div>}

      {showNotifs && <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={function() { setShowNotifs(false); }}>
        <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[60vh] overflow-y-auto animate-slideUp" onClick={function(e) { e.stopPropagation(); }}>
          <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-lg">🔔 通知</h3>
            <button onClick={function() { setShowNotifs(false); }} className="text-gray-400 text-xl">✕</button>
          </div>
          <div className="p-4 space-y-2">
            {notifs.length === 0
              ? <p className="text-gray-400 text-center py-8">暂无通知</p>
              : notifs.map(function(n) { return (
                  <div key={n.id} className={'p-3 rounded-xl ' + (n.is_read ? 'bg-gray-50' : 'bg-indigo-50 border border-indigo-100')}>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.created_at}</p>
                  </div>
                ); })}
          </div>
        </div>
      </div>}

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
        <div className="bg-gray-800 text-white px-6 py-2 rounded-full shadow-lg text-sm">{message}</div>
      </div>}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom z-40">
        <div className="max-w-lg mx-auto flex">
          {[{key:'tasks', label:'任务', icon:'📋'},{key:'record', label:'记录', icon:'📊'}].map(function(item) { return (
            <button key={item.key} onClick={function() { setTab(item.key); }}
              className={'flex-1 py-3 flex flex-col items-center gap-0.5 transition ' + (tab === item.key ? 'text-indigo-600' : 'text-gray-400')}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ); })}
        </div>
      </div>
    </div>
  );
}
