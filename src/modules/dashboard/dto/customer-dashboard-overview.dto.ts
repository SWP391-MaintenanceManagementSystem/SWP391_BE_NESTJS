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

export class SpendingPointDTO {
  @Expose()
  key: string;

  @Expose()
  amount: number;
}

export class SpendingSummaryDTO {
  @Expose()
  @Type(() => SpendingPointDTO)
  week: SpendingPointDTO[];

  @Expose()
  @Type(() => SpendingPointDTO)
  month: SpendingPointDTO[];

  @Expose()
  @Type(() => SpendingPointDTO)
  year: SpendingPointDTO[];

  @Expose()
  total: number;

  @Expose()
  average: number;

  @Expose()
  peak: {
    key: string;
    amount: number;
  };
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
