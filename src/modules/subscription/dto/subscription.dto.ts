import { SubscriptionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';
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
  @Transform(({ obj }) => {
    const localDate = toZonedTime(obj.startDate, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  startDate: string;
  @Transform(({ obj }) => {
    const localDate = toZonedTime(obj.endDate, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  endDate: string;
}
