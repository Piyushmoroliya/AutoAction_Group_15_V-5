import apiClient from '../api';

export interface Event {
  id: number;
  user_id: number;
  event_name: string;
  event_date: string;
  event_time?: string;
  venue?: string;
  description?: string;
  capture_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface EventCreate {
  event_name: string;
  event_date: string;
  event_time?: string;
  venue?: string;
  description?: string;
  capture_id?: number;
}

export interface EventUpdate {
  event_name?: string;
  event_date?: string;
  event_time?: string;
  venue?: string;
  description?: string;
}

export const eventsService = {
  async createEvent(data: EventCreate): Promise<Event> {
    const response = await apiClient.post<Event>('/v1/events', data);
    return response.data;
  },

  async listEvents(skip: number = 0, limit: number = 100): Promise<Event[]> {
    const response = await apiClient.get<Event[]>('/v1/events', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getEvent(eventId: number): Promise<Event> {
    const response = await apiClient.get<Event>(`/v1/events/${eventId}`);
    return response.data;
  },

  async updateEvent(eventId: number, data: EventUpdate): Promise<Event> {
    const response = await apiClient.put<Event>(`/v1/events/${eventId}`, data);
    return response.data;
  },

  async deleteEvent(eventId: number): Promise<void> {
    await apiClient.delete(`/v1/events/${eventId}`);
  },
};
