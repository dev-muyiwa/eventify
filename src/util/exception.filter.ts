import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { error } from './function';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'internal server error';
    let errors = null;

    if (exception instanceof HttpException) {
      const formatValidationErrors = (errors: any[]): any[] => {
        return errors.map((err) => {
          return {
            path: err.property,
            message: Object.values(err.constraints)[0] as string,
          };
        });
      };
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      if (status !== HttpStatus.INTERNAL_SERVER_ERROR) {
        if (
          status === HttpStatus.BAD_REQUEST &&
          Array.isArray(exceptionResponse.message)
        ) {
          message = 'validation errors';
          errors = formatValidationErrors(exceptionResponse.message);
        } else {
          message =
            exceptionResponse.message ||
            exception.message ||
            'an error occurred';
        }
      }
    }

    const errorResponse = error(message, errors);

    const logMessage = {
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      headers: request.headers,
      query: request.query,
      params: request.params,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    this.logger.error(JSON.stringify(logMessage));

    response.status(status).json(errorResponse);
  }
}
