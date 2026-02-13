
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Report, Settings, ProjectStatus } from '../types';
import { store } from '../store';
import ProjectCard from '../components/ProjectCard';
import DonationModal from '../components/DonationModal';

const Home = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [p, r, s] = await Promise.all([
        store.getProjects(),
        store.getReports(),
        store.getSettings()
      ]);

      const sorted = [...p].sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return b.createdAt - a.createdAt;
      });

      setProjects(sorted);
      setReports([...r].sort((a, b) => b.date - a.date));
      setSettings(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-stone-400 font-bold animate-pulse">جاري جلب البيانات من المنصة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-4">
          {settings?.mosqueName}
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 leading-tight">
          ساهم في <span className="text-emerald-600">مشاريع الخير</span>
        </h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          منصة شفافة لعرض مشاريع الخير واحتياجات المساجد، ومتابعة تقدمها. تبرعك اليوم هو صدقة جارية تنفعك في الدنيا والآخرة.
        </p>
      </motion.section>

      <section className="mb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-stone-800">المشاريع الحالية</h2>
          <div className="h-1 flex-grow mx-8 bg-stone-100 rounded-full hidden md:block"></div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200">
            <p className="text-stone-400 text-lg">لا توجد مشاريع نشطة حالياً. شكراً لمساهمتكم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {projects.map((project, idx) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDonate={() => setSelectedProject(project)}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="bg-emerald-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">تقارير الشفافية</h2>
              <p className="text-emerald-100 opacity-80">نشارككم بكل أمانة حصيلة التبرعات الأسبوعية</p>
            </div>
            <div className="bg-white/10 backdrop-blur px-6 py-4 rounded-2xl border border-white/10">
              <p className="text-sm text-emerald-200 mb-1">إجمالي التقارير</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                whileHover={{ x: -10 }}
                className="bg-white/5 hover:bg-white/10 border border-white/5 p-6 rounded-2xl transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 block">
                      {new Date(report.date).toLocaleDateString('ar-DZ', { dateStyle: 'long' })}
                    </span>
                    <h3 className="text-xl font-bold mb-2">{report.title}</h3>
                    <p className="text-emerald-100/70 leading-relaxed">{report.description}</p>
                  </div>
                  <div className="text-right min-w-[150px]">
                    <p className="text-sm text-emerald-300 mb-1">المبلغ المجمع</p>
                    <p className="text-2xl font-black text-white">{report.totalCollected.toLocaleString()} دج</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {reports.length === 0 && (
              <p className="text-center py-10 text-emerald-100/40">لا توجد تقارير منشورة بعد.</p>
            )}
          </div>
        </div>
      </section>

      <DonationModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        rip={settings?.rip || ""}
      />
    </div>
  );
};

export default Home;
