export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
  error_code: string;
}

export interface PaginatedData<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
