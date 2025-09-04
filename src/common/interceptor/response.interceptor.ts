import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isEmpty } from 'src/utils';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(res => {
        const { message, ...rest } = res;
        return {
          success: true,
          data: isEmpty(rest) ? null : rest,
          message: message ?? 'Request Successful',
          timestamp: new Date().toISOString(),
          path: context.switchToHttp().getRequest().url,
        };
      })
    );
  }
}
