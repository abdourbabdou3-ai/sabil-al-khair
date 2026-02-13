
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';

interface DonationModalProps {
  project: Project | null;
  onClose: () => void;
  rip: string;
}

const DonationModal: React.FC<DonationModalProps> = ({ project, onClose, rip }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
             <h3 className="text-3xl font-bold mb-2">تبرع للمشروع</h3>
             <p className="text-emerald-100 font-medium">{project.title}</p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200">
                <p className="text-stone-400 text-sm font-bold uppercase mb-4 text-center">رقم الحساب الجاري (RIP)</p>
                <div className="flex flex-col items-center gap-4">
                  <span className="text-xl md:text-2xl font-black text-stone-800 tracking-wider text-center break-all">
                    {rip}
                  </span>
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
                      copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-600'
                    }`}
                  >
                    {copied ? 'تم النسخ بنجاح' : 'نسخ رقم الحساب'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-2xl">💡</span>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    يرجى التبرع عبر تطبيق <strong>BaridiMob</strong> أو التوجه لأي مكتب بريد. لا يتم معالجة مبالغ داخل هذا الموقع، نكتفي بعرض تقدم الأشغال فقط.
                  </p>
                </div>

                <div className="text-center p-6 border-2 border-dashed border-emerald-100 rounded-[2rem]">
                  <p className="text-emerald-700 font-bold text-lg mb-1">"تبرع بأي مبلغ تستطيع، جزاك الله خيراً"</p>
                  <p className="text-stone-400 text-sm italic">"من بنى لله مسجداً ولو كمفحص قطاة بنى الله له بيتاً في الجنة"</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 text-stone-400 font-bold hover:text-stone-600 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DonationModal;
