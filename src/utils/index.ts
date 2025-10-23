import * as bcrypt from 'bcryptjs';
import {} from 'date-fns';
import * as ms from 'ms';
import * as dateFns from 'date-fns';
import { PeriodType } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

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

const isUTC = (date: Date) => date.getTimezoneOffset() === 0;

const isVN = (date: Date) => date.getTimezoneOffset() === -420; // -7*60

const utcToVNDate = (date: Date) => {
  if (isVN(date) || isUTC(date)) {
    return date;
  }
  return toZonedTime(date, 'Asia/Ho_Chi_Minh');
};

const vnToUtcDate = (date: Date) => {
  if (isVN(date) || isUTC(date)) {
    return date;
  }
  return fromZonedTime(date, 'Asia/Ho_Chi_Minh');
};

const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const stringToDate = (dateStr: string): Date => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const timeStringToDate = (time: string): Date => {
  return new Date(`1970-01-01T${time}Z`);
};

const dateToTimeString = (date: Date): string => {
  return date.toISOString().substring(11, 19);
};

export {
  hashPassword,
  comparePassword,
  convertMStoDate,
  isEmpty,
  getVNDayOfWeek,
  utcToVNDate,
  vnToUtcDate,
  dateToString,
  stringToDate,
  timeStringToDate,
  dateToTimeString,
};
