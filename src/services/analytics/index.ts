import apiClient from '../api';

export interface UpcomingAssignmentsResponse {
  assignments: any[];
  count: number;
  days: number;
}

export interface UpcomingExamsResponse {
  exams: any[];
  count: number;
  days: number;
}

export interface UpcomingEventsResponse {
  events: any[];
  count: number;
  days: number;
}

export interface TransactionSummary {
  total_amount: number;
  transaction_count: number;
  by_category: Record<string, number>;
  by_merchant: Record<string, number>;
}

export interface AssignmentDeadlineSummary {
  pending: number;
  completed: number;
  overdue: number;
  by_subject: Record<string, number>;
}

export interface SubjectBreakdown {
  subject: string;
  assignments_count: number;
  exams_count: number;
  materials_count: number;
}

export const analyticsService = {
  async getUpcomingAssignments(days: number = 7): Promise<UpcomingAssignmentsResponse> {
    const response = await apiClient.get<UpcomingAssignmentsResponse>(
      '/v1/insights/upcoming-assignments',
      { params: { days } }
    );
    return response.data;
  },

  async getUpcomingExams(days: number = 30): Promise<UpcomingExamsResponse> {
    const response = await apiClient.get<UpcomingExamsResponse>(
      '/v1/insights/upcoming-exams',
      { params: { days } }
    );
    return response.data;
  },

  async getUpcomingEvents(days: number = 30): Promise<UpcomingEventsResponse> {
    const response = await apiClient.get<UpcomingEventsResponse>(
      '/v1/insights/upcoming-events',
      { params: { days } }
    );
    return response.data;
  },

  async getTransactionSummary(days: number = 30): Promise<TransactionSummary> {
    const response = await apiClient.get<TransactionSummary>(
      '/v1/insights/transaction-summary',
      { params: { days } }
    );
    return response.data;
  },

  async getAssignmentDeadlineSummary(): Promise<AssignmentDeadlineSummary> {
    const response = await apiClient.get<AssignmentDeadlineSummary>(
      '/v1/insights/assignment-deadline-summary'
    );
    return response.data;
  },

  async getSubjectBreakdown(): Promise<{ subjects: SubjectBreakdown[] }> {
    const response = await apiClient.get<{ subjects: SubjectBreakdown[] }>(
      '/v1/insights/subject-breakdown'
    );
    return response.data;
  },
};
