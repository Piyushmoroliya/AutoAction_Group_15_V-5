import apiClient from '../api';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  merchant?: string;
  transaction_date?: string;
  transaction_reference?: string;
  payment_status: PaymentStatus;
  category?: string;
  capture_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCreate {
  amount: number;
  merchant?: string;
  transaction_date?: string;
  transaction_reference?: string;
  payment_status?: PaymentStatus;
  category?: string;
  capture_id?: number;
}

export interface ExpenseUpdate {
  amount?: number;
  merchant?: string;
  transaction_date?: string;
  transaction_reference?: string;
  payment_status?: PaymentStatus;
  category?: string;
}

export const expensesService = {
  async createExpense(data: ExpenseCreate): Promise<Expense> {
    const response = await apiClient.post<Expense>('/v1/expenses', data);
    return response.data;
  },

  async listExpenses(skip: number = 0, limit: number = 100): Promise<Expense[]> {
    const response = await apiClient.get<Expense[]>('/v1/expenses', {
      params: { skip, limit },
    });
    return response.data;
  },

  async getExpense(expenseId: number): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/v1/expenses/${expenseId}`);
    return response.data;
  },

  async updateExpense(expenseId: number, data: ExpenseUpdate): Promise<Expense> {
    const response = await apiClient.put<Expense>(`/v1/expenses/${expenseId}`, data);
    return response.data;
  },

  async deleteExpense(expenseId: number): Promise<void> {
    await apiClient.delete(`/v1/expenses/${expenseId}`);
  },
};
