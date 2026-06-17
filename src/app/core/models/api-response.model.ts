/**
 * Standard API response envelope — matches the backend gateway format.
 * Every successful response is wrapped in { data, success, message }.
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

/**
 * Paginated list response.
 * Backend services return { data: T[] } for list endpoints.
 * Pagination is handled at the gateway level for the lists that support it.
 */
export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
  success:    boolean;
  message:    string;
}

export interface ApiError {
  message:       string;
  code:          string;
  correlationId?: string;
  details?:      Record<string, string>;
}
