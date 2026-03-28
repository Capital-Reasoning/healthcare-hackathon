import type {
  PaginationParams,
  ApiResponse,
  ApiErrorResponse,
} from '@/types/api';

export function parsePaginationParams(
  searchParams: URLSearchParams,
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)),
  );
  return { page, pageSize };
}

export function parseSortParams(
  searchParams: URLSearchParams,
): { field: string; direction: 'asc' | 'desc' } | null {
  const sort = searchParams.get('sort');
  if (!sort) return null;
  const [field, dir] = sort.split(':');
  if (!field) return null;
  return { field, direction: dir === 'desc' ? 'desc' : 'asc' };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): ApiResponse<T[]> {
  return {
    data,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
    error: null,
  };
}

export function buildErrorResponse(error: string): ApiErrorResponse {
  return { data: null, meta: null, error };
}
