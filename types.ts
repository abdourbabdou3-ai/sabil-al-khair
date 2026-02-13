
export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetAmount: number;
  currentAmount: number;
  isImportant: boolean;
  status: ProjectStatus;
  createdAt: number;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  totalCollected: number;
  date: number;
}

export interface Settings {
  mosqueName: string;
  rip: string;
}

export interface Distribution {
  projectId: string;
  percentage: number;
}
