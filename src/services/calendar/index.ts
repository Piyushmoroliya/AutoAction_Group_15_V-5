import apiClient from '../api';

export type ReminderStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  reminder_time: string;
  status: ReminderStatus;
  assignment_id?: number;
  exam_id?: number;
  event_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ReminderCreate {
  title: string;
  description?: string;
  reminder_time: string;
  status?: ReminderStatus;
  assignment_id?: number;
  exam_id?: number;
  event_id?: number;
}

export interface ReminderUpdate {
  title?: string;
  description?: string;
  reminder_time?: string;
  status?: ReminderStatus;
}

export const remindersService = {
  async createReminder(data: ReminderCreate): Promise<Reminder> {
    const response = await apiClient.post<Reminder>('/v1/reminders', data);
    return response.data;
  },

  async listReminders(
    status?: ReminderStatus,
    skip: number = 0,
    limit: number = 100
  ): Promise<Reminder[]> {
    const params: any = { skip, limit };
    if (status) params.status = status;

    const response = await apiClient.get<Reminder[]>('/v1/reminders', { params });
    return response.data;
  },

  async getReminder(reminderId: number): Promise<Reminder> {
    const response = await apiClient.get<Reminder>(`/v1/reminders/${reminderId}`);
    return response.data;
  },

  async updateReminder(reminderId: number, data: ReminderUpdate): Promise<Reminder> {
    const response = await apiClient.put<Reminder>(`/v1/reminders/${reminderId}`, data);
    return response.data;
  },

  async deleteReminder(reminderId: number): Promise<void> {
    await apiClient.delete(`/v1/reminders/${reminderId}`);
  },
};
