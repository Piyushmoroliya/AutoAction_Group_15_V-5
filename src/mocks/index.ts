import { useStore } from '../store/useStore';
import {
  mockCaptures,
  mockTasks,
  mockExpenses,
  mockAcademicMaterials,
  mockEvents,
  mockExaminations,
} from './mockData';

export function initializeMockData() {
  const store = useStore.getState();

  // Only initialize if store is empty
  if (store.captures.length === 0) {
    mockCaptures.forEach((capture) => store.addCapture(capture));
  }
  if (store.tasks.length === 0) {
    mockTasks.forEach((task) => store.addTask(task));
  }
  if (store.expenses.length === 0) {
    mockExpenses.forEach((expense) => store.addExpense(expense));
  }
  if (store.academicMaterials.length === 0) {
    mockAcademicMaterials.forEach((material) => store.addAcademicMaterial(material));
  }
  if (store.events.length === 0) {
    mockEvents.forEach((event) => store.addEvent(event));
  }
  if (store.examinations.length === 0) {
    mockExaminations.forEach((exam) => store.addExamination(exam));
  }
}
