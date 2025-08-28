import { AuthProvider } from '@prisma/client';

export interface OAuthUserDTO {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}
