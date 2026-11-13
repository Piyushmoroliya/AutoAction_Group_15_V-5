import apiClient from '../api';

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Assignment {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  subject?: string;
  deadline?: string;
  platform?: string;
  status: AssignmentStatus;
  capture_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface AssignmentCreate {
  title: string;
  description?: string;
  subject?: string;
  deadline?: string;
  platform?: string;
  status?: AssignmentStatus;
  capture_id?: number;
}

export interface AssignmentUpdate {
  title?: string;
  description?: string;
  subject?: string;
  deadline?: string;
  platform?: string;
  status?: AssignmentStatus;
}

export const assignmentsService = {
  async createAssignment(data: AssignmentCreate): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/v1/assignments', data);
    return response.data;
  },

  async listAssignments(skip: number = 0, limit: number = 100): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>('/v1/assignments', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getAssignment(assignmentId: number): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/v1/assignments/${assignmentId}`);
    return response.data;
  },

  async updateAssignment(
    assignmentId: number,
    data: AssignmentUpdate
  ): Promise<Assignment> {
    const response = await apiClient.put<Assignment>(
      `/v1/assignments/${assignmentId}`,
      data
    );
    return response.data;
  },

  async deleteAssignment(assignmentId: number): Promise<void> {
    await apiClient.delete(`/v1/assignments/${assignmentId}`);
  },
};
