import {
    Injectable,
    ValidationPipe as NestValidationPipe,
    ValidationError,
} from '@nestjs/common';
import { ValidationException } from '../exception/validation.exception';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
    protected flattenValidationErrors(validationErrors: ValidationError[]): string[] {
        return validationErrors
            .map(error =>
                Object.values(error.constraints ?? {})
                    .map(msg => `${error.property}: ${msg}`)
            )
            .flat();
    }

    public createExceptionFactory() {
        return (validationErrors: ValidationError[] = []) => {
            const errors: Record<string, string> = {};

            validationErrors.forEach(err => {
                if (err.constraints) {
                    errors[err.property] = Object.values(err.constraints).join(', '); 
                }
            });

            return new ValidationException(errors);
        };
    }
}
