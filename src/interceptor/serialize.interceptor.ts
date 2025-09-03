import { UseInterceptors, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): object;
}

// Create a decorator to use the SerializeInterceptor
export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    // Run before handling the handler

    return handler.handle().pipe(
      map((data: any) => {
        // Run before sending the response
        // covert to json
        return plainToInstance(this.dto, data, {
          // Execute only the fields with Expose()
          excludeExtraneousValues: true,
        });
      })
    );
  }
}
