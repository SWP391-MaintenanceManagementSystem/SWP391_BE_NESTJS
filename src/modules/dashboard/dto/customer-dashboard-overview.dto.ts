import { Expose, Type } from 'class-transformer';

export class StatusSummaryDTO {
  @Expose()
  status: string;

  @Expose()
  count: number;

  @Expose()
  percentage: number;
}

export class CenterSummaryDTO {
  @Expose()
  center: string;

  @Expose()
  count: number;

  @Expose()
  percentage: number;
}

export class SpendingSummaryDTO {
  @Expose()
  week: number;

  @Expose()
  month: number;

  @Expose()
  year: number;
}

export class CustomerDashboardDTO {
  @Expose()
  bookingTotal: number;

  @Expose()
  @Type(() => StatusSummaryDTO)
  bookingStatusSummary: StatusSummaryDTO[];

  @Expose()
  @Type(() => CenterSummaryDTO)
  bookingsByCenter: CenterSummaryDTO[];

  @Expose()
  @Type(() => SpendingSummaryDTO)
  totalSpending: SpendingSummaryDTO;
}
