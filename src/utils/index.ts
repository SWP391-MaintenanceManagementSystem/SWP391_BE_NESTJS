import * as bcrypt from 'bcryptjs';
import {} from 'date-fns';
import * as ms from 'ms';
import * as dateFns from 'date-fns';
import { PeriodType } from '@prisma/client';

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
  startDate: Date = new Date()
): Date {
  switch (type) {
    case PeriodType.DAY:
      return dateFns.addDays(startDate, duration);
    case PeriodType.MONTH:
      return dateFns.addMonths(startDate, duration);
    case PeriodType.YEAR:
      return dateFns.addYears(startDate, duration);
    default:
      throw new Error('Invalid period type');
  }
}

export { hashPassword, comparePassword, convertMStoDate, isEmpty };
