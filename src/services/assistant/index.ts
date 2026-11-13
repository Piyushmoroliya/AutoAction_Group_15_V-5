import apiClient from '../api';

export interface ChatMessage {
  id: number;
  user_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatMessageCreate {
  role: 'user' | 'assistant';
  content: string;
}

export const chatService = {
  async createMessage(data: ChatMessageCreate): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/v1/chat', data);
    return response.data;
  },

  async listMessages(skip: number = 0, limit: number = 100): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>('/v1/chat', {
      params: { skip, limit },
    });
    return response.data;
  },

  async clearHistory(): Promise<void> {
    await apiClient.delete('/v1/chat');
  },
};
