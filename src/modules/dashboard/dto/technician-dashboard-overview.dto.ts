import { Expose } from 'class-transformer';

export class TechnicianDashboardOverviewDTO {
  @Expose()
  totalBookings: number;
  @Expose()
  completed: number;
  @Expose()
  inProgress: number;
  @Expose()
  pending: number;
}
