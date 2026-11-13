import apiClient from '../api';

export type ActionType = 'create_reminder' | 'update_status' | 'send_notification' | 'delete_record' | 'custom';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Action {
  id: number;
  user_id: number;
  action_type: ActionType;
  target_type?: string;
  target_id?: number;
  action_data?: string;
  status: ActionStatus;
  execution_time?: string;
  result?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export const actionsService = {
  async listActions(status?: ActionStatus, skip: number = 0, limit: number = 50): Promise<Action[]> {
    const params: any = { skip, limit };
    if (status) params.status = status;
    const response = await apiClient.get<Action[]>('/v1/actions', { params });
    return response.data;
  },

  async getAction(id: number): Promise<Action> {
    const response = await apiClient.get<Action>(`/v1/actions/${id}`);
    return response.data;
  },
};
