export function timeStringToDate(time: string): Date {
  return new Date(`1970-01-01T${time}Z`);
}

export function dateToTimeString(date: Date): string {
  return date.toISOString().substring(11, 19);
}
