import { create } from 'zustand';
import { CAPTURE_CATEGORIES, EXPENSE_CATEGORIES, TASK_PRIORITIES, TASK_STATUS } from '../constants/categories';

export interface Capture {
  id: string;
  imageUrl: string;
  category: (typeof CAPTURE_CATEGORIES)[keyof typeof CAPTURE_CATEGORIES];
  title: string;
  extractedText: string;
  confidence?: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  fields?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  deadline?: Date;
  priority: (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];
  status: (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
  captureId?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];
  date: Date;
  transactionId?: string;
  status?: string;
  captureId?: string;
  createdAt: Date;
}

export interface AcademicMaterial {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  notes: string;
  keyConcepts?: string[];
  formulas?: string[];
  explanation?: string;
  captureId?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  time?: string;
  venue?: string;
  captureId?: string;
  reminderSet: boolean;
  createdAt: Date;
}

export interface Examination {
  id: string;
  subject: string;
  date: Date;
  time?: string;
  venue?: string;
  academicMaterialId?: string;
  reminderSet: boolean;
  createdAt: Date;
}

interface AppState {
  captures: Capture[];
  tasks: Task[];
  expenses: Expense[];
  academicMaterials: AcademicMaterial[];
  events: Event[];
  examinations: Examination[];
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; read: boolean; createdAt: Date }>;

  // Actions
  addCapture: (capture: Omit<Capture, 'id' | 'createdAt'>) => void;
  updateCapture: (id: string, updates: Partial<Capture>) => void;
  deleteCapture: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addAcademicMaterial: (material: Omit<AcademicMaterial, 'id' | 'createdAt'>) => void;
  updateAcademicMaterial: (id: string, updates: Partial<AcademicMaterial>) => void;
  deleteAcademicMaterial: (id: string) => void;

  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  addExamination: (exam: Omit<Examination, 'id' | 'createdAt'>) => void;
  updateExamination: (id: string, updates: Partial<Examination>) => void;
  deleteExamination: (id: string) => void;

  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  captures: [],
  tasks: [],
  expenses: [],
  academicMaterials: [],
  events: [],
  examinations: [],
  notifications: [],

  addCapture: (capture) =>
    set((state) => ({
      captures: [
        ...state.captures,
        { ...capture, id: crypto.randomUUID(), createdAt: new Date() },
      ],
    })),

  updateCapture: (id, updates) =>
    set((state) => ({
      captures: state.captures.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  deleteCapture: (id) =>
    set((state) => ({
      captures: state.captures.filter((c) => c.id !== id),
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), createdAt: new Date() }],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  addExpense: (expense) =>
    set((state) => ({
      expenses: [
        ...state.expenses,
        { ...expense, id: crypto.randomUUID(), createdAt: new Date() },
      ],
    })),

  updateExpense: (id, updates) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  addAcademicMaterial: (material) =>
    set((state) => ({
      academicMaterials: [
        ...state.academicMaterials,
        { ...material, id: crypto.randomUUID(), createdAt: new Date() },
      ],
    })),

  updateAcademicMaterial: (id, updates) =>
    set((state) => ({
      academicMaterials: state.academicMaterials.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  deleteAcademicMaterial: (id) =>
    set((state) => ({
      academicMaterials: state.academicMaterials.filter((m) => m.id !== id),
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, { ...event, id: crypto.randomUUID(), createdAt: new Date() }],
    })),

  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),

  addExamination: (exam) =>
    set((state) => ({
      examinations: [
        ...state.examinations,
        { ...exam, id: crypto.randomUUID(), createdAt: new Date() },
      ],
    })),

  updateExamination: (id, updates) =>
    set((state) => ({
      examinations: state.examinations.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteExamination: (id) =>
    set((state) => ({
      examinations: state.examinations.filter((e) => e.id !== id),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID(), createdAt: new Date(), read: false },
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
}));
