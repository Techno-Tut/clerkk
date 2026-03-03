// Income Types
export interface UserIncomeCreate {
  gross_annual_estimate: number;
}

export interface IncomeEventCreate {
  source_id?: number | null;
  event_type: 'pay' | 'bonus' | 'rsu' | 'other';
  gross_amount?: number | null;
  net_amount: number;
  region: string;
  event_date: string;
  notes?: string | null;
}

// Expense Types
export interface ExpenseCreate {
  category: string;
  name: string;
  amount: number;
}

export interface ExpenseUpdate {
  amount: number;
  reason?: string | null;
}

// API Response Types
export interface ApiResponse {
  message: string;
}

export interface IncomeCreateResponse extends ApiResponse {
  user_id: string;
}

export interface IncomeEventResponse extends ApiResponse {
  event_id: number;
}

export interface ExpenseCreateResponse extends ApiResponse {
  expense_id: number;
}

export interface ExpenseUpdateResponse extends ApiResponse {
  expense_id: number;
}

export interface ExpenseTotalResponse {
  total_expenses: number;
}
