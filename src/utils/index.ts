import * as bcrypt from 'bcryptjs';
import {} from 'date-fns';
import * as ms from 'ms';
import * as dateFns from 'date-fns';
import { PeriodType } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

const convertMStoDate = (duration: ms.StringValue) => {
  const d = ms(duration);
  return new Date(Date.now() + d);
};

function isEmpty(obj: object) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function convertToPeriod(
  type: PeriodType,
  duration: number,
  currentDate: Date = new Date()
): Date {
  switch (type) {
    case PeriodType.DAY:
      return dateFns.addDays(currentDate, duration);
    case PeriodType.MONTH:
      return dateFns.addMonths(currentDate, duration);
    case PeriodType.YEAR:
      return dateFns.addYears(currentDate, duration);
    default:
      throw new Error('Invalid period type');
  }
}

const getVNDayOfWeek = (date: Date) => {
  const vnTime = toZonedTime(date, 'Asia/Ho_Chi_Minh');
  return vnTime.getDay();
};

const toVNDate = (date: Date) => {
  return toZonedTime(date, 'Asia/Ho_Chi_Minh');
};

export { hashPassword, comparePassword, convertMStoDate, isEmpty, getVNDayOfWeek, toVNDate };
