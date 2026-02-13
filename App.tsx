
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { store } from './store';

// UI Components
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';

const Navbar = () => {
  const loggedIn = store.isLoggedIn();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
              <span className="text-xl font-bold">S</span>
            </div>
            <span className="text-xl font-extrabold text-stone-800 tracking-tight">سبيل الخير</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-stone-600 hover:text-emerald-600 font-medium px-3 py-2 transition-colors">الرئيسية</Link>
            {loggedIn && (
              <Link to="/admin" className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold hover:bg-emerald-100 transition-all border border-emerald-100">
                لوحة التحكم
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-stone-900 text-white py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold">S</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-2">منصة سبيل الخير</h3>
      <p className="text-stone-400 mb-8 max-w-md mx-auto">معاً ندعم مشاريع الخير ونسعى للرقيّ والبركة في مجتمعنا.</p>
      <div className="border-t border-stone-800 pt-8 text-sm text-stone-500">
        &copy; {new Date().getFullYear()} جميع الحقوق محفوظة.
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* الرابط السري للإمام فقط */}
            <Route path="/imam-gate-2025" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
