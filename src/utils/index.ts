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

const utcToVNDate = (date: Date) => {
  return toZonedTime(date, 'Asia/Ho_Chi_Minh');
};

const vnToUtcDate = (date: Date) => {
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

export const localTimeToDate = (timeStr: string): Date => {
  const [h, m, s = 0] = timeStr.split(':').map(Number);

  return new Date(Date.UTC(1970, 0, 1, h, m, s));
};

// Convert Date to ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
const dateToISOString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString();
};

// Convert ISO string to Date
const isoStringToDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  return new Date(dateStr);
};

// Convert Date to local datetime string (YYYY-MM-DDTHH:mm:ss)
const dateToLocalString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString().slice(0, 19); // Remove milliseconds and Z
};

// Convert string to Date, handling both ISO and local formats
const parseDate = (dateStr: string | Date | null | undefined): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
};

const timeStringToDate = (time: string): Date => {
  return new Date(`1970-01-01T${time}Z`);
};

const dateToTimeString = (date: Date): string => {
  return date.toISOString().substring(11, 19);
};

function encodeBase64(input: string): string {
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function b64DecodeUnicode(str: string) {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

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
  dateToISOString,
  isoStringToDate,
  dateToLocalString,
  parseDate,
  timeStringToDate,
  dateToTimeString,
  encodeBase64,
  b64DecodeUnicode,
};
