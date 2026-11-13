import apiClient from '../api';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Capture {
  id: number;
  user_id: number;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  processing_status: ProcessingStatus;
  predicted_category?: string;
  confidence_score?: number;
  ocr_text?: string;
  extracted_data?: string;
  error_message?: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface ConfirmActionPayload {
  category: string;
  fields: Record<string, any>;
  create_reminder?: boolean;
}

export interface ConfirmActionResponse {
  success: boolean;
  message: string;
  category: string;
  target_type: string;
  target_id: number;
  capture_id: number;
  action_type: string;
  reminder_id?: number | null;
}

export interface ProcessingResult {
  capture_id: number;
  predicted_category: string;
  confidence_score: number;
  ocr_text?: string;
  extracted_data?: Record<string, any>;
  error_message?: string;
}

export const capturesService = {
  async uploadCapture(file: File): Promise<Capture> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Capture>('/v1/captures/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async listCaptures(skip: number = 0, limit: number = 100): Promise<Capture[]> {
    const response = await apiClient.get<Capture[]>('/v1/captures', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getCapture(captureId: number): Promise<Capture> {
    const response = await apiClient.get<Capture>(`/v1/captures/${captureId}`);
    return response.data;
  },

  async updateCaptureProcessing(
    captureId: number,
    processingData: ProcessingResult
  ): Promise<Capture> {
    const response = await apiClient.put<Capture>(
      `/v1/captures/${captureId}/process`,
      processingData
    );
    return response.data;
  },

  async deleteCapture(captureId: number): Promise<void> {
    await apiClient.delete(`/v1/captures/${captureId}`);
  },

  async confirmAction(
    captureId: number,
    payload: ConfirmActionPayload
  ): Promise<ConfirmActionResponse> {
    const response = await apiClient.post<ConfirmActionResponse>(
      `/v1/captures/${captureId}/confirm-action`,
      payload
    );
    return response.data;
  },
};
