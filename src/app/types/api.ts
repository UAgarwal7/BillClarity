// API types — ApiResponse, ApiError, PaginatedResponse

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
}
