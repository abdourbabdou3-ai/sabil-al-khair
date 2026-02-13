
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { store } from '../store';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // كلمة السر الرسمية المطلوبة
    if (password === 'Sabil@Khair#2025') {
      store.login();
      navigate('/admin');
    } else {
      setError('رمز الدخول غير صحيح، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-stone-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg">
            🔑
          </div>
          <h2 className="text-2xl font-bold text-stone-800">بوابة الإدارة</h2>
          <p className="text-stone-400 mt-2 text-sm">منطقة محمية - الدخول للإمام فقط</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-stone-500 mb-2 mr-2 uppercase tracking-wider">رمز المرور الخاص</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-center"
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-xs mt-3 mr-2 font-bold">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-lg hover:bg-stone-800 transition-all shadow-xl active:scale-95"
          >
            تأكيد الهوية والدخول
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-stone-50 text-center">
           <p className="text-[10px] text-stone-300 font-bold leading-relaxed">
             هذا النظام محمي تقنياً. يتم تخزين البيانات بشكل آمن في قاعدة البيانات المحلية.
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
