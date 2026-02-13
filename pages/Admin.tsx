
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Report, Settings, ProjectStatus } from '../types';
import { store } from '../store';
import { generateDescription, generateDetailedReport } from '../services/aiService';

interface ManualDist {
  projectId: string;
  amount: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'weekly' | 'reports' | 'settings'>('projects');

  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [globalBalance, setGlobalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Pot states
  const [newCollectedAmount, setNewCollectedAmount] = useState<number>(0);
  const [manualDists, setManualDists] = useState<ManualDist[]>([]);

  // Modal Fields
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalTarget, setModalTarget] = useState(0);
  const [modalImportant, setModalImportant] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Report Modal Fields
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [isPrePublish, setIsPrePublish] = useState(false);
  const [tempReportData, setTempReportData] = useState<{ collected: number } | null>(null);

  useEffect(() => {
    if (!store.isLoggedIn()) {
      navigate('/imam-gate-2025'); // العودة للمسار السري إذا لم يسجل الدخول
      return;
    }
    setDbConnected(store.checkConnection());
    refreshData();
  }, [navigate]);

  const refreshData = async () => {
    setLoading(true);
    const [p, r, s, balance] = await Promise.all([
      store.getProjects(),
      store.getReports(),
      store.getSettings(),
      store.getGlobalBalance()
    ]);
    setProjects(p);
    setReports(r);
    setSettings(s);
    setGlobalBalance(balance);
    setLoading(false);
  };

  // New file state
  const [modalFile, setModalFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModalFile(file); // Store the actual file
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle) return alert("يرجى إدخال اسم المشروع أولاً.");

    setSyncing(true);

    const formData = new FormData();
    formData.append('id', editingProject?.id || Math.random().toString(36).substr(2, 9));
    formData.append('title', modalTitle);
    formData.append('description', modalDesc);
    formData.append('targetAmount', modalTarget.toString());
    formData.append('currentAmount', (editingProject?.currentAmount || 0).toString());
    formData.append('isImportant', modalImportant.toString());
    formData.append('status', editingProject?.status || ProjectStatus.ACTIVE);
    if (editingProject?.createdAt) formData.append('createdAt', editingProject.createdAt.toString());
    else formData.append('createdAt', Date.now().toString());

    if (modalFile) {
      formData.append('image', modalFile);
    } else {
      formData.append('imageUrl', modalImage || "https://images.unsplash.com/photo-1469571483320-da58317449cc?q=80&w=1200&auto=format&fit=crop");
    }

    if (editingProject) {
      await store.updateProjectWithImage(formData);
    } else {
      await store.createProjectWithImage(formData);
    }

    setShowProjectModal(false);
    await refreshData();
    setSyncing(false);
  };

  const openProjectModal = (project: Project | null) => {
    if (project) {
      setEditingProject(project);
      setModalTitle(project.title);
      setModalDesc(project.description);
      setModalTarget(project.targetAmount);
      setModalImportant(project.isImportant);
      setModalImage(project.imageUrl);
    } else {
      setEditingProject(null);
      setModalTitle("");
      setModalDesc("");
      setModalTarget(0);
      setModalImportant(false);
      setModalImage(null);
      setModalFile(null);
    }
    setShowProjectModal(true);
  };

  const totalAvailable = newCollectedAmount + globalBalance;
  const totalDistributedNow = manualDists.reduce((sum, d) => sum + d.amount, 0);
  const leftoverForNextTime = totalAvailable - totalDistributedNow;

  const updateManualDistValue = (projectId: string, val: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const remainingNeeded = Math.max(0, project.targetAmount - project.currentAmount);
    const safeAmount = Math.min(val, remainingNeeded);

    setManualDists(prev => {
      const existing = prev.find(d => d.projectId === projectId);
      if (existing) return prev.map(d => d.projectId === projectId ? { ...d, amount: safeAmount } : d);
      return [...prev, { projectId, amount: safeAmount }];
    });
  };

  const handleWeeklyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalDistributedNow > totalAvailable) return alert('خطأ: المبلغ الموزع يتجاوز الرصيد المتوفر!');
    if (totalDistributedNow === 0 && newCollectedAmount === 0) return alert('يرجى إدخال مبلغ أو توزيع رصيد.');

    setSyncing(true);
    await store.distributeFundsManual(totalAvailable, manualDists);
    const updatedProjects = await store.getProjects();
    const newGlobalBalance = await store.getGlobalBalance();

    const detailedDesc = await generateDetailedReport(
      newCollectedAmount,
      totalDistributedNow,
      updatedProjects,
      manualDists,
      newGlobalBalance
    );

    setReportTitle(`بيان مالي: حصيلة يوم ${new Date().toLocaleDateString('ar-DZ')}`);
    setReportDesc(detailedDesc);
    setTempReportData({ collected: newCollectedAmount });
    setIsPrePublish(true);
    setEditingReport(null);
    setShowReportModal(true);

    setNewCollectedAmount(0);
    setManualDists([]);
    await refreshData();
    setSyncing(false);
  };

  const handleSaveReport = async () => {
    if (!reportTitle || !reportDesc) return alert("يرجى ملء جميع الحقول");

    setSyncing(true);
    if (isPrePublish) {
      const newReport: Report = {
        id: Math.random().toString(36).substr(2, 9),
        title: reportTitle,
        description: reportDesc,
        totalCollected: tempReportData?.collected || 0,
        date: Date.now()
      };
      await store.saveReports([newReport, ...reports]);
      alert('تم التوزيع بنجاح ونشر التقرير المالي.');
    } else if (editingReport) {
      const updatedReports = reports.map(r =>
        r.id === editingReport.id
          ? { ...r, title: reportTitle, description: reportDesc }
          : r
      );
      await store.saveReports(updatedReports);
      alert('تم تحديث التقرير بنجاح.');
    }

    setShowReportModal(false);
    await refreshData();
    setSyncing(false);
  };

  const openReportEdit = (report: Report) => {
    setEditingReport(report);
    setReportTitle(report.title);
    setReportDesc(report.description);
    setIsPrePublish(false);
    setShowReportModal(true);
  };

  if (loading && !syncing) return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="font-bold text-stone-400">جاري الاتصال بقاعدة البيانات...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-stone-900">{settings?.mosqueName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <p className="text-stone-500 font-bold text-xs">
              {dbConnected ? 'قاعدة البيانات: متصلة ونشطة' : 'قاعدة البيانات: فشل الاتصال'}
            </p>
          </div>
        </div>
        <button onClick={() => { store.logout(); navigate('/'); }} className="bg-stone-50 text-stone-500 px-6 py-2 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-stone-100">تسجيل خروج</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-3">
          <NavBtn active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} label="إدارة المشاريع" icon="🏗️" />
          <NavBtn active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} label="توزيع التبرعات" icon="💰" />
          <NavBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="التقارير المالية" icon="📜" />
          <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="⚙️" />
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'projects' && (
              <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">مشاريع المسجد</h2>
                  <button onClick={() => openProjectModal(null)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-emerald-700 transition-all">+ مشروع جديد</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-stone-200 group hover:border-emerald-500 transition-all shadow-sm">
                      <div className="h-40 rounded-2xl overflow-hidden relative mb-4">
                        <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={p.title} />
                        {p.isImportant && <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg">أولوية</span>}
                        {p.status === ProjectStatus.COMPLETED && <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-sm flex items-center justify-center"><span className="bg-white text-emerald-600 px-4 py-1 rounded-full font-black text-sm shadow-md">مكتمل ✅</span></div>}
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-stone-800">{p.title}</h4>
                          <p className="text-stone-400 text-xs font-bold">{p.targetAmount.toLocaleString()} دج</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openProjectModal(p)} className="p-2 text-stone-300 hover:text-emerald-600 transition-colors">✏️</button>
                          <button onClick={async () => { if (confirm('حذف المشروع؟')) { await store.deleteProject(p.id); await refreshData(); } }} className="p-2 text-stone-300 hover:text-red-500 transition-colors">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'weekly' && (
              <motion.div key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-200 shadow-xl">
                  <h2 className="text-3xl font-black mb-10 text-stone-800">توزيع حصيلة الخزينة</h2>
                  <form onSubmit={handleWeeklyUpdate} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-700 mr-2">تبرعات جديدة (دج)</label>
                        <input type="number" value={newCollectedAmount || ""} onChange={e => setNewCollectedAmount(Number(e.target.value))} className="w-full px-8 py-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-3xl font-black text-emerald-700 outline-none focus:border-emerald-300" placeholder="0.00" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-stone-400 mr-2">رصيد الخزينة السابق (دج)</label>
                        <div className="w-full px-8 py-5 rounded-2xl bg-stone-50 border-2 border-stone-100 text-3xl font-black text-stone-400 flex items-center">
                          {globalBalance.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-stone-900 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border border-white/5">
                      <div className="text-center md:text-right">
                        <p className="text-stone-400 text-sm font-bold uppercase mb-1">الإجمالي للتوزيع</p>
                        <p className="text-4xl font-black text-emerald-400">{totalAvailable.toLocaleString()} <span className="text-lg">دج</span></p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-stone-400 text-sm font-bold uppercase mb-1">الرصيد المتبقي للمستقبل</p>
                        <p className={`text-3xl font-black ${leftoverForNextTime >= 0 ? 'text-white' : 'text-red-400'}`}>
                          {leftoverForNextTime.toLocaleString()} دج
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-bold flex items-center gap-2 mb-6 text-stone-800">تخصيص المبالغ</h4>
                      {projects.filter(p => p.status === ProjectStatus.ACTIVE).map(p => {
                        const dist = manualDists.find(d => d.projectId === p.id);
                        const isSelected = !!dist;
                        const remainingNeeded = Math.max(0, p.targetAmount - p.currentAmount);
                        return (
                          <div key={p.id} className={`flex flex-col md:flex-row items-center gap-4 p-5 rounded-3xl border-2 transition-all ${isSelected ? 'border-emerald-500 bg-white shadow-lg' : 'border-stone-50 bg-stone-50 opacity-60'}`}>
                            <div className="flex items-center gap-4 flex-grow w-full">
                              <input type="checkbox" checked={isSelected} onChange={e => e.target.checked ? setManualDists([...manualDists, { projectId: p.id, amount: 0 }]) : setManualDists(manualDists.filter(d => d.projectId !== p.id))} className="w-6 h-6 accent-emerald-600 rounded" />
                              <div className="flex-grow">
                                <span className="font-bold text-stone-800 text-lg">{p.title}</span>
                                <p className="text-xs text-stone-400 font-bold mt-1">المتبقي للاكتمال: <span className="text-emerald-600">{remainingNeeded.toLocaleString()} دج</span></p>
                              </div>
                            </div>
                            {isSelected && (
                              <input type="number" max={remainingNeeded} value={dist.amount || ""} onChange={e => updateManualDistValue(p.id, Number(e.target.value))} className="w-full md:w-64 px-6 py-4 rounded-xl border-2 border-stone-200 font-black text-center focus:border-emerald-500 outline-none" placeholder="0.00" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button type="submit" disabled={(totalDistributedNow === 0 && newCollectedAmount === 0) || leftoverForNextTime < 0} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-emerald-700 disabled:opacity-30 transition-all">تأكيد التوزيع ونشر التقرير</button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {reports.map(rep => (
                  <div key={rep.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-stone-800 text-xl">{rep.title}</h4>
                      <span className="text-xs font-bold text-stone-400">{new Date(rep.date).toLocaleDateString('ar-DZ')}</span>
                    </div>
                    <div className="text-stone-600 whitespace-pre-wrap leading-relaxed">{rep.description}</div>
                    <div className="mt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openReportEdit(rep)} className="text-xs text-emerald-600 font-bold">✏️ تعديل التقرير</button>
                      <button onClick={async () => { if (confirm('حذف التقرير؟')) { await store.deleteReport(rep.id); await refreshData(); } }} className="text-xs text-red-500 font-bold">🗑️ حذف التقرير</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 max-w-xl shadow-xl">
                  <h2 className="text-2xl font-bold mb-8">إعدادات المنصة</h2>
                  <form onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); await store.saveSettings({ mosqueName: f.get('n') as string, rip: f.get('r') as string }); refreshData(); alert('تم الحفظ'); }} className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-stone-400 mr-2">اسم المسجد</label>
                      <input name="n" defaultValue={settings?.mosqueName} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 font-bold focus:border-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-400 mr-2">رقم الحساب الجاري (RIP)</label>
                      <input name="r" defaultValue={settings?.rip} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 font-black text-emerald-700 focus:border-emerald-500 outline-none" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 shadow-lg transition-all">حفظ التغييرات</button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md" onClick={() => setShowProjectModal(false)}></div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-stone-50/50">
              <h3 className="text-xl font-black text-stone-800">{editingProject ? 'تعديل المشروع' : 'مشروع جديد'}</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-2xl hover:text-red-500">&times;</button>
            </div>

            <div className="overflow-y-auto p-8 space-y-6">
              <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200">
                {modalImage ? (
                  <img src={modalImage} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400">
                    <p className="text-xs font-bold">يرجى رفع صورة للمشروع</p>
                  </div>
                )}
              </div>

              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-bold text-xs border border-stone-200">📁 رفع صورة يدوياً</button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

              <input value={modalTitle} onChange={e => setModalTitle(e.target.value)} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 font-bold outline-none" placeholder="اسم المشروع..." />

              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={modalTarget} onChange={e => setModalTarget(Number(e.target.value))} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 font-black" placeholder="الميزانية (دج)" />
                <label className="flex items-center gap-3 bg-stone-50 px-4 rounded-xl border border-stone-100 cursor-pointer">
                  <input type="checkbox" checked={modalImportant} onChange={e => setModalImportant(e.target.checked)} className="w-5 h-5 accent-red-500" />
                  <span className="font-bold text-xs text-stone-500">أولوية قصوى</span>
                </label>
              </div>

              <div>
                <button type="button" onClick={async () => {
                  if (!modalTitle) return alert("اكتب الاسم أولاً");
                  setModalDesc(await generateDescription(modalTitle));
                }} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">📝 استخدام قالب جاهز</button>
                <textarea value={modalDesc} onChange={e => setModalDesc(e.target.value)} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 h-32 outline-none text-sm" placeholder="وصف المشروع..." />
              </div>

              <button onClick={handleSaveProject} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50">
                نشر المشروع
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md" onClick={() => setShowReportModal(false)}></div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-stone-50/50">
              <h3 className="text-xl font-black text-stone-800">{isPrePublish ? 'مراجعة التقرير قبل النشر' : 'تعديل التقرير المنشور'}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-2xl hover:text-red-500">&times;</button>
            </div>

            <div className="overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 mr-2">عنوان التقرير</label>
                <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 font-bold outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 mr-2">محتوى التقرير</label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} required className="w-full px-6 py-4 rounded-xl bg-stone-50 border border-stone-100 h-96 outline-none text-sm leading-relaxed" />
              </div>

              <button onClick={handleSaveReport} disabled={syncing} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50">
                {syncing ? "جاري الحفظ..." : (isPrePublish ? "تأكيد ونشر التقرير" : "حفظ التعديلات")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const NavBtn = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-stone-400 hover:bg-stone-50 border border-stone-100 shadow-sm'}`}>
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
  </button>
);

export default Admin;
