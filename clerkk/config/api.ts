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
import type {components} from '../types/api-generated';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserProfileResponse = components['schemas']['UserProfileResponse'];
type OnboardingCompleteResponse =
  components['schemas']['OnboardingCompleteResponse'];

const API_URL_KEY = '@clerkk_api_url';

// Get API URL from storage or use default
const getApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    if (url) return url;
  } catch {}

  // Default URLs
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const API_URL = await getApiUrl();

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
  user: {
    getProfile: (token: string) =>
      request<UserProfileResponse>('/user/me', {}, token),

    completeOnboarding: (token: string) =>
      request<OnboardingCompleteResponse>(
        '/user/complete-onboarding',
        {method: 'POST'},
        token,
      ),

    // Complete full onboarding flow
    submitOnboarding: async (
      data: {
        grossAnnual: number;
        expenses: Array<{category: string; name: string; amount: number}>;
        region: string;
      },
      token: string,
    ) => {
      // 1. Save income
      await request<IncomeCreateResponse>(
        '/income/',
        {
          method: 'POST',
          body: JSON.stringify({gross_annual_estimate: data.grossAnnual}),
        },
        token,
      );

      // 2. Save expenses (batch)
      if (data.expenses.length > 0) {
        await request(
          '/expenses/',
          {method: 'POST', body: JSON.stringify(data.expenses)},
          token,
        );
      }

      // 3. Mark onboarding complete
      return request<OnboardingCompleteResponse>(
        '/user/complete-onboarding',
        {method: 'POST'},
        token,
      );
    },
  },

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

  dashboard: {
    getStats: (period: 'monthly' | 'yearly', token: string) =>
      request<components['schemas']['DashboardResponse']>(
        `/dashboard/stats?period=${period}`,
        {},
        token,
      ),
  },
};
