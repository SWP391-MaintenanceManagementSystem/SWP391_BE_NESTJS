import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationErrorResponse, DefaultErrorResponse } from '../types/exceptions.type';
import { AccountStatus } from '@prisma/client';


type CustomErrorResponse = ValidationErrorResponse | DefaultErrorResponse | string;

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as CustomErrorResponse;

    let message: string | null = null;
    let errors: Record<string, string> | null = null;
    let accountStatus: AccountStatus | null = null;

    if (typeof exceptionResponse === 'string') {
      // Trường hợp throw string
      message = exceptionResponse;
    } else if ('errors' in exceptionResponse) {
      // Validation error
      message = exceptionResponse.message;
      errors = exceptionResponse.errors;
    } else {
      if (Array.isArray(exceptionResponse.message)) {
        message = exceptionResponse.message.join(', ');
      } else {
        message = exceptionResponse.message;
      }

      if ('accountStatus' in exceptionResponse) {
        accountStatus = exceptionResponse.accountStatus as AccountStatus;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      data: null,
      accountStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
