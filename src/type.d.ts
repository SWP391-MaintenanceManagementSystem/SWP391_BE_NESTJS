import { Account } from '@prisma/client';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends Account {}
    interface Request {
      user;
    }
  }
}
