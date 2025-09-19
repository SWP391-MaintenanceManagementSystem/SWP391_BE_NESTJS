import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '@prisma/client';

export const ROLE_KEY = 'role';

export const Roles = (...role: AccountRole[]) => SetMetadata(ROLE_KEY, role);
