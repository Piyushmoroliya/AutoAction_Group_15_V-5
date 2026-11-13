import apiClient from '../api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const params = new URLSearchParams();
    params.append('username', credentials.username.trim());
    params.append('password', credentials.password);

    const response = await apiClient.post<AuthResponse>('/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store token
    localStorage.setItem('access_token', response.data.access_token);

    return response.data;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<User>('/v1/auth/register', {
      email: data.email.trim(),
      username: data.username.trim(),
      password: data.password,
      full_name: data.full_name?.trim() || undefined,
    });
    // Auto-login after registration
    await this.login({ username: data.username.trim(), password: data.password });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/v1/users/me');
    return response.data;
  },

  async updateUser(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/v1/users/me', data);
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
