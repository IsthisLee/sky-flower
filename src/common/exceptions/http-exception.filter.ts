import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FailResponse } from '../interface';

type Err = string | { message?: string | string[]; error?: string };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const stack = exception.stack;

    if (!(exception instanceof HttpException)) {
      exception = new InternalServerErrorException(exception.message);
    }

    const err: Err = (exception as HttpException).getResponse();
    const statusCode = (exception as HttpException).getStatus();
    const resObject: FailResponse = {
      success: false,
      statusCode,
      messages:
        typeof err === 'string'
          ? [err]
          : typeof err.message === 'string'
          ? [err.message]
          : err.message ?? [exception.message] ?? null,
      detail: this.getDetail(exception, err, req),
    };

    this.logErrorOrWarning(stack, resObject);

    response.status(statusCode).json(resObject);
  }

  private getDetail(
    exception: HttpException | Error,
    err: Err,
    request: Request,
  ): string | null {
    if (typeof err === 'string') return `${err} at [ '${request.url}' ]`;
    if (exception.name) return `${exception.name} at [ '${request.url}' ]`;
    if (err.error) return `${err.error} at [ '${request.url}' ]`;

    return null;
  }

  private logErrorOrWarning(stack: string, resObject: FailResponse): void {
    if (resObject.statusCode >= 500) {
      this.logger.error(stack);
    } else {
      this.logger.warn(stack);
    }
  }
}
