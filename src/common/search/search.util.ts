import { Prisma } from '@prisma/client';

export const containsInsensitive = (value?: string): Prisma.StringFilter | undefined =>
  value ? { contains: value, mode: 'insensitive' } : undefined;

export const buildBookingSearch = (keyword?: string): Prisma.BookingWhereInput | undefined => {
  if (!keyword?.trim()) return undefined;
  return {
    OR: [
      { note: containsInsensitive(keyword) },
      {
        id: containsInsensitive(keyword),
      },
      {
        customer: {
          OR: [
            { firstName: containsInsensitive(keyword) },
            { lastName: containsInsensitive(keyword) },
            {
              account: {
                OR: [
                  { email: containsInsensitive(keyword) },
                  { phone: containsInsensitive(keyword) },
                ],
              },
            },
          ],
        },
      },
      {
        vehicle: {
          OR: [
            { licensePlate: containsInsensitive(keyword) },
            { vin: containsInsensitive(keyword) },
            { vehicleModel: { name: containsInsensitive(keyword) } },
          ],
        },
      },
    ],
  };
};
