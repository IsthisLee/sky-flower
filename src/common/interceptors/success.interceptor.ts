import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../interface';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse> {
    return next.handle().pipe(
      map((data: SuccessResponse | boolean) => {
        if (typeof data === 'boolean') {
          return { success: data };
        }

        if (!data) {
          return { success: true };
        }

        const success = data.success;
        if (typeof data.success === 'boolean') delete data.success;

        const isExistPassedData = data.data;

        if (isExistPassedData) {
          return {
            success: success ?? true,
            ...data,
          } as SuccessResponse;
        }

        return {
          success: success ?? true,
          data: data,
        } as SuccessResponse;
      }),
    );
  }
}
