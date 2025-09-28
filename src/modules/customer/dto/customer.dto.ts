import { Exclude, Expose, Transform } from 'class-transformer';

export class CustomerDTO {
  @Exclude()
  accountId: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  address?: string;

  @Expose()
  isPremium: boolean;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;
}
