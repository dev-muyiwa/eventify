import { Knex } from 'knex';
import { Event } from '../events/entities/event.entity';

export interface Response<T> {
  success: boolean;
  data: T | null;
  message: string;
}

interface ErrorResponse<T> {
  success: boolean;
  error: T | null;
  message: string;
}

export function success<T>(
  data: T,
  message: string = 'Request was successful',
): Response<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function error(message: string, err?: any): ErrorResponse<null> {
  return {
    success: false,
    error: err ? err : null,
    message,
  };
}

export async function paginate<T extends NonNullable<unknown>>(
  queryBuilder: Knex.QueryBuilder<T>,
  page: number = 1,
  orderByColumn = 'created_at',
  orderDirection = 'asc',
): Promise<{
  total: number;
  data: T[];
  current_page: number | null;
  page_size: number;
  prev_page: string | null;
  next_page: string | null;
}> {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const dataQuery = queryBuilder
    .clone()
    .select('*')
    .orderBy(orderByColumn, orderDirection)
    .limit(pageSize)
    .offset(offset);

  const [data, total] = await Promise.all([
    dataQuery,
    queryBuilder.clone().count('id'),
  ]);

  const totalRecords =
    total && total.length ? parseInt(total[0].count as string, 10) : 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    total: totalRecords,
    data: data as T[],
    current_page: page,
    prev_page: page > 1 ? `?page=${page - 1}&pageSize=${pageSize}` : null,
    next_page:
      page < totalPages ? `?page=${page + 1}&pageSize=${pageSize}` : null,
    page_size: pageSize,
  };
}
