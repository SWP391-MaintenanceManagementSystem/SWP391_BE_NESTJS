import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JWT_Payload } from 'src/types';

@Injectable()
export class VerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user as JWT_Payload;

        if (!user?.isVerified) {
            throw new ForbiddenException('Account is not verified. Please check your email.');
        }

        return true;
    }
}
