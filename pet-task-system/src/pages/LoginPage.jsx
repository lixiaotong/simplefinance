import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  var [isRegister, setIsRegister] = useState(false);
  var [form, setForm] = useState({ username:'', password:'', nickname:'' });
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  var handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isRegister) {
        await register(form.username, form.password, form.nickname);
        nav('/home');
      } else {
        var data = await login(form.username, form.password);
        nav(data.user.role === 'admin' ? '/admin' : '/home');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce-slow">🐣</div>
          <h1 className="text-3xl font-bold text-white">电子宠物作业助手</h1>
          <p className="text-indigo-100 mt-2">完成任务，养育你的专属小宠物</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button onClick={function() {setIsRegister(false); setError('');}} className={'flex-1 py-2 rounded-lg text-sm font-medium transition ' + (!isRegister ? 'bg-white shadow text-indigo-600' : 'text-gray-500')}>登录</button>
            <button onClick={function() {setIsRegister(true); setError('');}} className={'flex-1 py-2 rounded-lg text-sm font-medium transition ' + (isRegister ? 'bg-white shadow text-indigo-600' : 'text-gray-500')}>注册</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" value={form.username} onChange={function(e) { setForm({...form, username:e.target.value}); }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="请输入用户名" required />
            </div>
            {isRegister && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input type="text" value={form.nickname} onChange={function(e) { setForm({...form, nickname:e.target.value}); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="你的显示名称" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" value={form.password} onChange={function(e) { setForm({...form, password:e.target.value}); }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="请输入密码" required />
            </div>
            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl animate-shake">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-200">
              {loading ? '处理中...' : isRegister ? '注册并开始' : '登录'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">管理员账号: admin / admin123</p>
          </form>
        </div>
      </div>
    </div>
  );
}
