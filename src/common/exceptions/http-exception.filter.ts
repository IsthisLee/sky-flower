import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { FailResponse } from '../interface';

interface Log {
  timestamp: string;
  method: string;
  url: string;
  res: FailResponse;
}
type Err = string | { message?: string; error?: string };

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
      message:
        typeof err === 'string'
          ? err
          : err.message ?? exception.message ?? null,
      detail: this.getDetail(exception, err, req),
    };

    this.logErrorOrWarning(stack, resObject, req);

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

  private logErrorOrWarning(
    stack: string,
    resObject: FailResponse,
    request: Request,
  ): void {
    const log: Log = {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      method: request.method,
      url: request.url,
      res: resObject,
    };

    if (resObject.statusCode >= 500) {
      this.logger.error(log, stack);
    } else {
      this.logger.warn(stack);
    }
  }
}