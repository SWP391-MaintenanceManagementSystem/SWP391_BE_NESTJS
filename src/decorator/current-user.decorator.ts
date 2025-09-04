import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWT_Payload } from 'src/types';

export const CurrentUser = createParamDecorator(
  (data: keyof JWT_Payload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);
