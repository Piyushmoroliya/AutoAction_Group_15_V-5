import apiClient from '../api';

export interface AcademicMaterial {
  id: number;
  user_id: number;
  subject: string;
  topic: string;
  subtopic?: string;
  content?: string;
  summary?: string;
  explanation?: string;
  capture_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface AcademicMaterialCreate {
  subject: string;
  topic: string;
  subtopic?: string;
  content?: string;
  summary?: string;
  explanation?: string;
  capture_id?: number;
}

export interface AcademicMaterialUpdate {
  subject?: string;
  topic?: string;
  subtopic?: string;
  content?: string;
  summary?: string;
  explanation?: string;
}

export const academicService = {
  async createAcademicMaterial(data: AcademicMaterialCreate): Promise<AcademicMaterial> {
    const response = await apiClient.post<AcademicMaterial>('/v1/academic-materials', data);
    return response.data;
  },

  async listAcademicMaterials(skip: number = 0, limit: number = 100): Promise<AcademicMaterial[]> {
    const response = await apiClient.get<AcademicMaterial[]>('/v1/academic-materials', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getAcademicMaterial(materialId: number): Promise<AcademicMaterial> {
    const response = await apiClient.get<AcademicMaterial>(`/v1/academic-materials/${materialId}`);
    return response.data;
  },

  async updateAcademicMaterial(
    materialId: number,
    data: AcademicMaterialUpdate
  ): Promise<AcademicMaterial> {
    const response = await apiClient.put<AcademicMaterial>(
      `/v1/academic-materials/${materialId}`,
      data
    );
    return response.data;
  },

  async deleteAcademicMaterial(materialId: number): Promise<void> {
    await apiClient.delete(`/v1/academic-materials/${materialId}`);
  },
};
