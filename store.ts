
import { Project, Report, Settings, ProjectStatus } from './types';

const API_BASE = (import.meta as any).env.VITE_API_URL || '/api';

export const store = {
  // فحص حالة الاتصال بقاعدة البيانات
  checkConnection: (): boolean => {
    return true; // Always true since we're using remote DB
  },

  getProjects: async (): Promise<Project[]> => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (e) {
      console.error('Error fetching projects:', e);
      return [];
    }
  },

  saveProjects: async (projects: Project[]) => {
    // This will be handled by individual create/update/delete calls
    // For batch save, we'll update each project
    for (const project of projects) {
      try {
        const exists = await fetch(`${API_BASE}/projects`).then(r => r.json());
        const existingProject = exists.find((p: Project) => p.id === project.id);

        if (existingProject) {
          await fetch(`${API_BASE}/projects`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
          });
        } else {
          await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
          });
        }
      } catch (e) {
        console.error('Error saving project:', e);
      }
    }
  },

  createProject: async (project: Project) => {
    const formData = new FormData();
    formData.append('id', project.id);
    formData.append('title', project.title);
    formData.append('description', project.description);
    formData.append('targetAmount', project.targetAmount.toString());
    formData.append('currentAmount', project.currentAmount.toString());
    formData.append('isImportant', project.isImportant.toString());
    formData.append('status', project.status);
    formData.append('imageUrl', project.imageUrl);
    formData.append('createdAt', project.createdAt.toString());

    await store.createProjectWithImage(formData);
  },

  createProjectWithImage: async (formData: FormData) => {
    // 1. Upload image if exists
    let imageUrl = formData.get('imageUrl') as string;
    const imageFile = formData.get('image');

    if (imageFile instanceof File) {
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        imageUrl = data.imageUrl;
      } else {
        console.error('Failed to upload image:', await res.text());
      }
    }

    // 2. Create Project object
    const project = {
      id: formData.get('id') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      targetAmount: Number(formData.get('targetAmount')),
      currentAmount: Number(formData.get('currentAmount')),
      isImportant: formData.get('isImportant') === 'true',
      status: formData.get('status') as ProjectStatus,
      imageUrl: imageUrl,
      createdAt: Number(formData.get('createdAt'))
    };

    // 3. Send JSON to projects API
    await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  },

  updateProject: async (project: Project) => {
    const formData = new FormData();
    formData.append('id', project.id);
    formData.append('title', project.title);
    formData.append('description', project.description);
    formData.append('targetAmount', project.targetAmount.toString());
    formData.append('currentAmount', project.currentAmount.toString());
    formData.append('isImportant', project.isImportant.toString());
    formData.append('status', project.status);
    formData.append('imageUrl', project.imageUrl);
    formData.append('createdAt', project.createdAt.toString());

    await store.updateProjectWithImage(formData);
  },

  updateProjectWithImage: async (formData: FormData) => {
    // 1. Upload image if exists
    let imageUrl = formData.get('imageUrl') as string;
    const imageFile = formData.get('image');

    if (imageFile instanceof File) {
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        imageUrl = data.imageUrl;
      } else {
        console.error('Failed to upload image:', await res.text());
      }
    }

    // 2. Create Project object
    const project = {
      id: formData.get('id') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      targetAmount: Number(formData.get('targetAmount')),
      currentAmount: Number(formData.get('currentAmount')),
      isImportant: formData.get('isImportant') === 'true',
      status: formData.get('status') as ProjectStatus,
      imageUrl: imageUrl,
      createdAt: Number(formData.get('createdAt'))
    };

    // 3. Send JSON to projects API
    await fetch(`${API_BASE}/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  },

  deleteProject: async (id: string) => {
    await fetch(`${API_BASE}/projects?id=${id}`, { method: 'DELETE' });
  },

  getReports: async (): Promise<Report[]> => {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return await res.json();
    } catch (e) {
      console.error('Error fetching reports:', e);
      return [];
    }
  },

  saveReports: async (reports: Report[]) => {
    // For batch save, handle each report
    for (const report of reports) {
      try {
        const exists = await fetch(`${API_BASE}/reports`).then(r => r.json());
        const existingReport = exists.find((r: Report) => r.id === report.id);

        if (existingReport) {
          await fetch(`${API_BASE}/reports`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
          });
        } else {
          await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
          });
        }
      } catch (e) {
        console.error('Error saving report:', e);
      }
    }
  },

  deleteReport: async (id: string) => {
    await fetch(`${API_BASE}/reports?id=${id}`, { method: 'DELETE' });
  },

  getSettings: async (): Promise<Settings> => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (e) {
      console.error('Error fetching settings:', e);
      return { mosqueName: 'سبيل الخير', rip: '' };
    }
  },

  saveSettings: async (settings: Settings) => {
    await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  getGlobalBalance: async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE}/balance`);
      if (!res.ok) throw new Error('Failed to fetch balance');
      const data = await res.json();
      return data.amount || 0;
    } catch (e) {
      console.error('Error fetching balance:', e);
      return 0;
    }
  },

  saveGlobalBalance: async (amount: number) => {
    await fetch(`${API_BASE}/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
  },

  isLoggedIn: () => {
    return localStorage.getItem('mosque_auth_v1') === 'true';
  },

  login: () => {
    localStorage.setItem('mosque_auth_v1', 'true');
  },

  logout: () => {
    localStorage.removeItem('mosque_auth_v1');
  },

  distributeFundsManual: async (totalAvailable: number, distributions: { projectId: string; amount: number }[]) => {
    const projects = await store.getProjects();
    let totalDistributed = 0;

    for (const project of projects) {
      const dist = distributions.find(d => d.projectId === project.id);
      if (dist && project.status === ProjectStatus.ACTIVE) {
        totalDistributed += dist.amount;
        const newTotal = project.currentAmount + dist.amount;
        const updatedProject = {
          ...project,
          currentAmount: Number(newTotal.toFixed(2)),
          status: newTotal >= project.targetAmount ? ProjectStatus.COMPLETED : ProjectStatus.ACTIVE
        };
        await store.updateProject(updatedProject);
      }
    }

    const newBalance = totalAvailable - totalDistributed;
    await store.saveGlobalBalance(Math.max(0, newBalance));
  }
};
