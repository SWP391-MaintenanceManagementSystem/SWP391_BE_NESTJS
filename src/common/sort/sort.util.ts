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
  order: Order,
  role: AccountRole
): Prisma.AccountOrderByWithRelationInput {
  const field = ACCOUNT_SORTABLE_FIELDS[sortBy] || ROLE_SORTABLE_FIELDS[role]?.[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }

  return JSON.parse(JSON.stringify(field).replace(/"asc"/g, `"${order}"`));
}

export function buildVehicleOrderBy(
  sortBy: string,
  order: Order
): Prisma.VehicleOrderByWithRelationInput {
  const field = VEHICLE_SORTABLE_FIELDS[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }

  return JSON.parse(JSON.stringify(field).replace(/"asc"/g, `"${order}"`));
}

export function buildBookingOrderBy(
  sortBy: string,
  order: Order
): Prisma.BookingOrderByWithRelationInput {
  const field = BOOKING_SORTABLE_FIELDS[sortBy];

  if (!field) {
    throw new BadRequestException(`Cannot sort by ${sortBy}`);
  }
  return JSON.parse(JSON.stringify(field).replace(/"asc"/g, `"${order}"`));
}
