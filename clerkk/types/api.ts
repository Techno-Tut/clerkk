// API Response Types (not generated as named schemas)
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
