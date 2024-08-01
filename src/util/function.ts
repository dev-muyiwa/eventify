import { SetMetadata } from '@nestjs/common';

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

export const IS_PUBLIC_KEY = 'isPublic';
export const SkipAuthorization = () => SetMetadata(IS_PUBLIC_KEY, true);
