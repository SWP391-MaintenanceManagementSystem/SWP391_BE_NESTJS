import { Prisma, AccountRole } from '@prisma/client';

export type Order = 'asc' | 'desc';
export type SortableFields<T> = Record<string, T>;

// ================= Account =================
export const ACCOUNT_SORTABLE_FIELDS: SortableFields<Prisma.AccountOrderByWithRelationInput> = {
  createdAt: { createdAt: 'asc' },
  email: { email: 'asc' },
  phone: { phone: 'asc' },
  status: { status: 'asc' },
};

const CUSTOMER_SORTABLE_FIELDS: SortableFields<Prisma.AccountOrderByWithRelationInput> = {
  firstName: { customer: { firstName: 'asc' } },
  lastName: { customer: { lastName: 'asc' } },
  address: { customer: { address: 'asc' } },
};

const EMPLOYEE_SORTABLE_FIELDS: SortableFields<Prisma.AccountOrderByWithRelationInput> = {
  firstName: { employee: { firstName: 'asc' } },
  lastName: { employee: { lastName: 'asc' } },
};

export const ROLE_SORTABLE_FIELDS: Record<
  AccountRole,
  SortableFields<Prisma.AccountOrderByWithRelationInput>
> = {
  [AccountRole.CUSTOMER]: CUSTOMER_SORTABLE_FIELDS,
  [AccountRole.PREMIUM]: CUSTOMER_SORTABLE_FIELDS,
  [AccountRole.STAFF]: EMPLOYEE_SORTABLE_FIELDS,
  [AccountRole.TECHNICIAN]: EMPLOYEE_SORTABLE_FIELDS,
  [AccountRole.ADMIN]: {},
};

// ================= Vehicle =================
export const VEHICLE_SORTABLE_FIELDS: SortableFields<Prisma.VehicleOrderByWithRelationInput> = {
  createdAt: { createdAt: 'asc' },
  licensePlate: { licensePlate: 'asc' },
  model: { vehicleModel: { name: 'asc' } },
  brand: { vehicleModel: { brand: { name: 'asc' } } },
  status: { status: 'asc' },
};

// ================= Booking =================
export const BOOKING_SORTABLE_FIELDS: SortableFields<Prisma.BookingOrderByWithRelationInput> = {
  createdAt: { createdAt: 'asc' },
  bookingDate: { bookingDate: 'asc' },
  status: { status: 'asc' },
  customer: { customer: { firstName: 'asc', lastName: 'asc' } },
  vehicle: { vehicle: { licensePlate: 'asc', vin: 'asc', vehicleModel: { name: 'asc' } } },
  center: { serviceCenter: { name: 'asc' } },
};
