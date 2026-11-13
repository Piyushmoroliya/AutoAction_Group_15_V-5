import apiClient from '../api';

export interface Exam {
  id: number;
  user_id: number;
  subject: string;
  exam_date: string;
  exam_time?: string;
  room_venue?: string;
  capture_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ExamCreate {
  subject: string;
  exam_date: string;
  exam_time?: string;
  room_venue?: string;
  capture_id?: number;
}

export interface ExamUpdate {
  subject?: string;
  exam_date?: string;
  exam_time?: string;
  room_venue?: string;
}

export const examsService = {
  async createExam(data: ExamCreate): Promise<Exam> {
    const response = await apiClient.post<Exam>('/v1/exams', data);
    return response.data;
  },

  async listExams(skip: number = 0, limit: number = 100): Promise<Exam[]> {
    const response = await apiClient.get<Exam[]>('/v1/exams', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getExam(examId: number): Promise<Exam> {
    const response = await apiClient.get<Exam>(`/v1/exams/${examId}`);
    return response.data;
  },

  async updateExam(examId: number, data: ExamUpdate): Promise<Exam> {
    const response = await apiClient.put<Exam>(`/v1/exams/${examId}`, data);
    return response.data;
  },

  async deleteExam(examId: number): Promise<void> {
    await apiClient.delete(`/v1/exams/${examId}`);
  },
};
