export class CustomerStatisticsItemDTO {
  status: string;
  count: number;
  percentage: number;
}

export class PremiumStatisticsDTO {
  count: number;
  percentage: number;
}

export class CustomerStatisticsDTO {
  data: CustomerStatisticsItemDTO[];
  premium: PremiumStatisticsDTO;
  total: number;
}
