import { SubscriptionStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { MembershipDTO } from 'src/modules/membership/dto/membership.dto';

export class SubscriptionDTO {
  @IsString()
  id: string;
  @IsString()
  customerId: string;
  @IsString()
  membership: MembershipDTO;
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  startDate: Date;
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  endDate: Date;
}
