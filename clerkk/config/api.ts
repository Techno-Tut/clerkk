import type {
  UserIncomeCreate,
  IncomeEventCreate,
  ExpenseCreate,
  ExpenseUpdate,
  IncomeCreateResponse,
  IncomeEventResponse,
  ExpenseCreateResponse,
  ExpenseUpdateResponse,
  ExpenseTotalResponse,
} from '../types/api';

const API_URL = 'http://localhost:8000';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  income: {
    create: (data: UserIncomeCreate, token: string) =>
      request<IncomeCreateResponse>(
        '/income/',
        {method: 'POST', body: JSON.stringify(data)},
        token,
      ),

    logEvent: (data: IncomeEventCreate, token: string) =>
      request<IncomeEventResponse>(
        '/income/events',
        {method: 'POST', body: JSON.stringify(data)},
        token,
      ),
  },

  expenses: {
    create: (data: ExpenseCreate, token: string) =>
      request<ExpenseCreateResponse>(
        '/expenses/',
        {method: 'POST', body: JSON.stringify(data)},
        token,
      ),

    update: (id: number, data: ExpenseUpdate, token: string) =>
      request<ExpenseUpdateResponse>(
        `/expenses/${id}`,
        {method: 'PUT', body: JSON.stringify(data)},
        token,
      ),

    getTotal: (token: string) =>
      request<ExpenseTotalResponse>('/expenses/total', {}, token),
  },
};
