export const CAPTURE_CATEGORIES = {
  PAYMENT: 'payment',
  ASSIGNMENT: 'assignment',
  ACADEMIC: 'academic',
  EVENT: 'event',
  EXAMINATION: 'examination',
  OTHER: 'other',
} as const;

export const EXPENSE_CATEGORIES = {
  FOOD: 'food',
  TRAVEL: 'travel',
  EDUCATION: 'education',
  SHOPPING: 'shopping',
  BILLS: 'bills',
  ENTERTAINMENT: 'entertainment',
  HEALTHCARE: 'healthcare',
  OTHER: 'other',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
} as const;
