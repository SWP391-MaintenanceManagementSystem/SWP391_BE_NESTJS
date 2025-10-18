import { Method, ReferenceType, TransactionStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class TransactionDTO {
  @Expose()
  id: string;

  @Expose()
  customerId: string;

  @Expose()
  referenceId?: string;

  @Expose()
  referenceType?: ReferenceType;

  @Expose()
  sessionId?: string;

  @Expose()
  amount: number;

  @Expose()
  status: TransactionStatus;

  @Expose()
  method: Method;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
