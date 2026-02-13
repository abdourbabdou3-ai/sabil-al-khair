
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, ProjectStatus } from '../types';

interface ProjectCardProps {
  project: Project;
  onDonate: () => void;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDonate, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
  const isCompleted = project.status === ProjectStatus.COMPLETED;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className={`group relative bg-white rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-xl shadow-stone-200/50 flex flex-col h-full ${isCompleted ? 'grayscale-[0.4] opacity-90' : ''}`}
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={project.imageUrl || `https://picsum.photos/seed/${project.id}/600/400`} 
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {project.isImportant && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              هام جداً
            </span>
          )}
          {isCompleted && (
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">
              مكتمل ✓
            </span>
          )}
        </div>
      </div>

      <div className="p-8 flex-grow flex flex-col">
        <h3 className="text-xl font-black text-stone-800 mb-3 group-hover:text-emerald-700 transition-colors">
          {project.title}
        </h3>
        
        <div className="relative mb-6">
          <p className={`text-stone-500 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
            {project.description}
          </p>
          {project.description.length > 120 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-emerald-600 text-xs font-bold mt-2 hover:text-emerald-700 transition-colors"
            >
              {isExpanded ? 'إخفاء التفاصيل' : 'إقرأ المزيد...'}
            </button>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase mb-0.5">المجمع</p>
              <p className="text-lg font-black text-emerald-600">
                {project.currentAmount.toLocaleString()} <span className="text-[10px] font-normal">دج</span>
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-stone-400 font-bold uppercase mb-0.5">الهدف</p>
              <p className="text-sm font-bold text-stone-700">
                {project.targetAmount.toLocaleString()} <span className="text-[10px] font-normal">دج</span>
              </p>
            </div>
          </div>

          <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-600 to-emerald-400`}
            />
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-400">
             <span>تم إنجاز {progress.toFixed(0)}%</span>
             {isCompleted && <span className="text-emerald-600">تم بحمد الله</span>}
          </div>

          <button
            onClick={onDonate}
            disabled={isCompleted}
            className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 ${
              isCompleted 
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-emerald-300'
            }`}
          >
            {isCompleted ? 'تم إكمال المشروع، بارك الله فيكم' : 'ساهم الآن بالتبرع'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
