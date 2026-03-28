export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta;
  error: string | null;
}

export interface ApiErrorResponse {
  data: null;
  meta: null;
  error: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export type FilterParams = Record<string, string | string[] | undefined>;
