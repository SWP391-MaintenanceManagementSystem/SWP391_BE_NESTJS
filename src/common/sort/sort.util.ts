import { BadRequestException } from '@nestjs/common';
import { AccountRole, Prisma } from '@prisma/client';
import {
  ACCOUNT_SORTABLE_FIELDS,
  Order,
  ROLE_SORTABLE_FIELDS,
  VEHICLE_SORTABLE_FIELDS,
  BOOKING_SORTABLE_FIELDS,
} from './sort.config';

export function buildAccountOrderBy(
  sortBy: string,
  order: Order = 'asc',
  role: AccountRole
): Prisma.AccountOrderByWithRelationInput {
  const field = ACCOUNT_SORTABLE_FIELDS[sortBy] || ROLE_SORTABLE_FIELDS[role]?.[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }

  return JSON.parse(JSON.stringify(field).replace(/"asc"/g, `"${order.toLowerCase()}"`));
}

export function buildVehicleOrderBy(
  sortBy: string,
  order: Order = 'asc'
): Prisma.VehicleOrderByWithRelationInput {
  const field = VEHICLE_SORTABLE_FIELDS[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }

  return JSON.parse(JSON.stringify(field).replace(/"asc"/g, `"${order.toLowerCase()}"`));
}

export function buildBookingOrderBy(
  sortBy: string,
  order: Order = 'asc'
):
  | Prisma.BookingOrderByWithRelationInput
  | Prisma.Enumerable<Prisma.BookingOrderByWithRelationInput> {
  if (sortBy === 'fullName') {
    return [{ customer: { firstName: order } }, { customer: { lastName: order } }];
  }

  const field = BOOKING_SORTABLE_FIELDS[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }

  return JSON.parse(JSON.stringify(field).replace(/"asc"|"desc"/g, `"${order.toLowerCase()}"`));
}
