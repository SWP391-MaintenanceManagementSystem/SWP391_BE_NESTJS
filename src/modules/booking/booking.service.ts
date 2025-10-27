import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { BookingDTO } from './dto/booking.dto';
import { plainToInstance } from 'class-transformer';
import { BookingQueryDTO } from './dto/booking-query.dto';
import {
  AccountRole,
  Booking,
  BookingStatus,
  Package,
  Prisma,
  Service,
  Shift,
} from '@prisma/client';
import * as dateFns from 'date-fns';
import { buildBookingSearch } from 'src/common/search/search.util';
import { buildBookingOrderBy } from 'src/common/sort/sort.util';
import { BookingDetailService } from '../booking-detail/booking-detail.service';
import { JWT_Payload } from 'src/common/types';
import { CustomerUpdateBookingDTO } from './dto/customer-update-booking.dto';
import { StaffUpdateBookingDTO } from './dto/staff-update-booking.dto';
import { AdminUpdateBookingDTO } from './dto/admin-update-booking.dto';
import { localTimeToDate, parseDate } from 'src/utils';
import { CustomerBookingService } from './customer-booking.service';
import { AdminBookingService } from './admin-booking.service';
import { StaffBookingService } from './staff-booking.service';
import { StaffBookingDTO } from './dto/staff-booking.dto';
import { TechnicianBookingService } from './technician-booking.service';
import { BookingHistoryQueryDTO } from './dto/booking-history-query.dto';
import { BookingHistoryDTO } from './dto/booking-history.dto';
@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService,
    private readonly customerBookingService: CustomerBookingService,
    private readonly adminBookingService: AdminBookingService,
    private readonly staffBookingService: StaffBookingService,
    private readonly technicianBookingService: TechnicianBookingService
  ) {}
  // async createBooking(
  //   bookingData: CreateBookingDTO,
  //   customerId: string
  // ): Promise<{ booking: BookingDTO; warning?: string }> {
  //   const {
  //     bookingDate,
  //     centerId,
  //     note,
  //     vehicleId,
  //     serviceIds = [],
  //     packageIds = [],
  //   } = bookingData;

  //   // Parse booking date
  //   const parsedBookingDate = parseDate(bookingDate);
  //   if (!parsedBookingDate) {
  //     throw new BadRequestException('Invalid booking date format');
  //   }

  //   // Extract booking time and validate shift
  //   const timePart = bookingDate.split('T')[1];
  //   const bookingTime = timePart.substring(0, 8);
  //   const bookingTimeAsDate = localTimeToDate(bookingTime);

  //   const workSchedule = await this.prismaService.workSchedule.findFirst({
  //     where: {
  //       date: {
  //         gte: dateFns.startOfDay(parsedBookingDate),
  //         lt: dateFns.endOfDay(parsedBookingDate),
  //       },
  //       shift: {
  //         centerId,
  //         status: 'ACTIVE',
  //         startTime: { lte: bookingTimeAsDate },
  //         endTime: { gt: bookingTimeAsDate },
  //       },
  //     },
  //     include: { shift: true },
  //   });

  //   if (!workSchedule) {
  //     throw new BadRequestException('No matching shift for this booking date');
  //   }

  //   // Check existing booking
  //   const existingBooking = await this.prismaService.booking.findFirst({
  //     where: {
  //       customerId,
  //       vehicleId,
  //       shiftId: workSchedule.shiftId,
  //       status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
  //     },
  //   });

  //   if (existingBooking) {
  //     throw new BadRequestException('You already have a booking for this vehicle at this time');
  //   }

  //   // Validate selected items
  //   if (serviceIds.length === 0 && packageIds.length === 0) {
  //     throw new BadRequestException('At least one service or package must be selected');
  //   }

  //   // Fetch selected services and packages
  //   const services: Service[] = serviceIds.length
  //     ? await this.prismaService.service.findMany({ where: { id: { in: serviceIds } } })
  //     : [];

  //   const packages: Package[] = packageIds.length
  //     ? await this.prismaService.package.findMany({ where: { id: { in: packageIds } } })
  //     : [];

  //   // Check missing IDs
  //   if (services.length !== serviceIds.length) {
  //     const missing = serviceIds.filter(id => !services.find(s => s.id === id));
  //     throw new BadRequestException(`Services not found: ${missing.join(', ')}`);
  //   }

  //   if (packages.length !== packageIds.length) {
  //     const missing = packageIds.filter(id => !packages.find(p => p.id === id));
  //     throw new BadRequestException(`Packages not found: ${missing.join(', ')}`);
  //   }

  //   const packageServiceMappings = await this.prismaService.packageDetail.findMany({
  //     where: { packageId: { in: packages.map(p => p.id) } },
  //   });

  //   const serviceIdsInPackages = new Set(packageServiceMappings.map(ps => ps.serviceId));
  //   const filteredServices = services.filter(s => !serviceIdsInPackages.has(s.id));

  //   let warning: string | undefined = undefined;
  //   if (workSchedule.shift.maximumSlot) {
  //     const currentBookingCount = await this.prismaService.booking.count({
  //       where: {
  //         shiftId: workSchedule.shiftId,
  //         status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
  //       },
  //     });

  //     if (currentBookingCount >= workSchedule.shift.maximumSlot) {
  //       warning = 'This shift is currently busy; you may experience some delays';
  //     }
  //   }

  //   // Create booking
  //   const createdBooking = await this.prismaService.booking.create({
  //     data: {
  //       bookingDate: parsedBookingDate,
  //       shiftId: workSchedule.shiftId,
  //       customerId,
  //       totalCost: 0,
  //       note,
  //       vehicleId,
  //       centerId,
  //     },
  //   });

  //   // ✅ Prepare booking detail items
  //   const bookingDetailsData = [
  //     ...packages.map(p => ({
  //       bookingId: createdBooking.id,
  //       packageId: p.id,
  //       unitPrice: p.price,
  //       quantity: 1,
  //     })),
  //     ...filteredServices.map(s => ({
  //       bookingId: createdBooking.id,
  //       serviceId: s.id,
  //       unitPrice: s.price,
  //       quantity: 1,
  //     })),
  //   ];

  //   if (bookingDetailsData.length > 0) {
  //     await this.bookingDetailService.createManyBookingDetails(bookingDetailsData);
  //   }

  //   // Calculate total cost
  //   const totalCost = await this.bookingDetailService.calculateTotalCost(createdBooking.id);

  //   const updatedBooking = await this.prismaService.booking.update({
  //     where: { id: createdBooking.id },
  //     data: { totalCost },
  //   });

  //   return {
  //     booking: plainToInstance(BookingDTO, updatedBooking),
  //     warning,
  //   };
  // }
  private async validateShiftAndGetSchedule(rawBookingDate: string, centerId: string) {
    const parsedDate = parseDate(rawBookingDate);
    if (!parsedDate) throw new BadRequestException('Invalid booking date format');

    const timePart = rawBookingDate.split('T')[1].substring(0, 8);
    const bookingTimeAsDate = localTimeToDate(timePart);

    const workSchedule = await this.prismaService.workSchedule.findFirst({
      where: {
        date: { gte: dateFns.startOfDay(parsedDate), lt: dateFns.endOfDay(parsedDate) },
        shift: {
          centerId,
          status: 'ACTIVE',
          startTime: { lte: bookingTimeAsDate },
          endTime: { gt: bookingTimeAsDate },
        },
      },
      include: { shift: true },
    });

    if (!workSchedule)
      throw new BadRequestException('No matching shift for this booking date/time');

    return workSchedule;
  }

  private async checkDuplicateBooking(customerId: string, vehicleId: string, shiftId: string) {
    const existing = await this.prismaService.booking.findFirst({
      where: {
        customerId,
        vehicleId,
        shiftId,
        status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
      },
    });
    if (existing)
      throw new BadRequestException('You already have a booking for this vehicle at this time');
  }

  private async fetchAndValidateServices(serviceIds: string[]): Promise<Service[]> {
    if (!serviceIds.length) return [];
    const services = await this.prismaService.service.findMany({
      where: { id: { in: serviceIds } },
    });
    if (services.length !== serviceIds.length) {
      const missing = serviceIds.filter(id => !services.some(s => s.id === id));
      throw new BadRequestException(`Services not found: ${missing.join(', ')}`);
    }
    return services;
  }

  private async fetchAndValidatePackages(packageIds: string[]): Promise<Package[]> {
    if (!packageIds.length) return [];
    const packages = await this.prismaService.package.findMany({
      where: { id: { in: packageIds } },
    });
    if (packages.length !== packageIds.length) {
      const missing = packageIds.filter(id => !packages.some(p => p.id === id));
      throw new BadRequestException(`Packages not found: ${missing.join(', ')}`);
    }
    return packages;
  }

  private async filterServicesInPackages(
    services: Service[],
    packages: Package[]
  ): Promise<Service[]> {
    if (!packages.length || !services.length) return services;
    const packageServiceMappings = await this.prismaService.packageDetail.findMany({
      where: { packageId: { in: packages.map(p => p.id) } },
    });
    const serviceIdsInPackages = new Set(packageServiceMappings.map(ps => ps.serviceId));
    return services.filter(s => !serviceIdsInPackages.has(s.id));
  }

  private async checkShiftCapacityAndSetWarning(shift: Shift): Promise<string | void> {
    if (!shift.maximumSlot) return;
    const currentCount = await this.prismaService.booking.count({
      where: { shiftId: shift.id, status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] } },
    });
    if (currentCount >= shift.maximumSlot)
      return 'This shift is currently busy; you may experience some delays';
  }

  private buildBookingDetails(bookingId: string, services: Service[], packages: Package[]) {
    return [
      ...packages.map(p => ({ bookingId, packageId: p.id, unitPrice: p.price, quantity: 1 })),
      ...services.map(s => ({ bookingId, serviceId: s.id, unitPrice: s.price, quantity: 1 })),
    ];
  }

  private async updateTotalCost(bookingId: string): Promise<Booking> {
    const totalCost = await this.bookingDetailService.calculateTotalCost(bookingId);
    return await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { totalCost },
    });
  }

  async createBooking(
    bookingData: CreateBookingDTO,
    customerId: string
  ): Promise<{ booking: BookingDTO; warning?: string }> {
    const {
      bookingDate,
      centerId,
      note,
      vehicleId,
      serviceIds = [],
      packageIds = [],
    } = bookingData;

    const workSchedule = await this.validateShiftAndGetSchedule(bookingDate, centerId);

    await this.checkDuplicateBooking(customerId, vehicleId, workSchedule.shiftId);

    const services = await this.fetchAndValidateServices(serviceIds);
    const packages = await this.fetchAndValidatePackages(packageIds);

    const filteredServices = await this.filterServicesInPackages(services, packages);

    const warning = await this.checkShiftCapacityAndSetWarning(workSchedule.shift);
    const parsedBookingDate = parseDate(bookingDate);
    if (!parsedBookingDate) {
      throw new BadRequestException('Invalid booking date format');
    }
    const createdBooking = await this.prismaService.booking.create({
      data: {
        bookingDate: parsedBookingDate,
        shiftId: workSchedule.shiftId,
        customerId,
        totalCost: 0,
        note,
        vehicleId,
        centerId,
      },
    });

    const bookingDetailsData = this.buildBookingDetails(
      createdBooking.id,
      filteredServices,
      packages
    );
    if (bookingDetailsData.length > 0) {
      await this.bookingDetailService.createManyBookingDetails(bookingDetailsData);
    }

    const updatedBooking = await this.updateTotalCost(createdBooking.id);

    return {
      booking: plainToInstance(BookingDTO, updatedBooking),
      warning: warning ?? undefined,
    };
  }

  async getBookingById(bookingId: string, user: JWT_Payload) {
    switch (user.role) {
      case AccountRole.CUSTOMER:
        return await this.customerBookingService.getBookingById(bookingId, user.sub);
      case AccountRole.TECHNICIAN:
        return await this.technicianBookingService.getBookingById(bookingId);
      case AccountRole.STAFF:
        return await this.staffBookingService.getBookingById(bookingId);
      case AccountRole.ADMIN:
        return await this.adminBookingService.getBookingById(bookingId);
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  private transformBookingByRole(booking: any, role: AccountRole) {
    switch (role) {
      case AccountRole.CUSTOMER:
        return plainToInstance(BookingDTO, booking, {
          excludeExtraneousValues: true,
        });

      case AccountRole.STAFF:
        return plainToInstance(StaffBookingDTO, booking, {
          excludeExtraneousValues: true,
        });

      case AccountRole.ADMIN:
      default:
        return plainToInstance(BookingDTO, booking, {
          excludeExtraneousValues: true,
        });
    }
  }

  async getBookings(
    filterOptions: BookingQueryDTO,
    user: JWT_Payload
  ): Promise<PaginationResponse<BookingDTO | StaffBookingDTO>> {
    const {
      search,
      status,
      bookingDate,
      centerId,
      shiftId,
      page = 1,
      pageSize = 10,
      orderBy = 'desc',
      sortBy = 'createdAt',
      fromDate,
      toDate,
      isPremium,
    } = filterOptions;

    // Convert string dates to Date objects for database comparison
    const dateFilter: Prisma.BookingWhereInput = {};
    const parsedFromDate = fromDate ? parseDate(fromDate) : null;
    const parsedToDate = toDate ? parseDate(toDate) : null;
    const parsedBookingDate = bookingDate ? parseDate(bookingDate) : null;

    if (parsedFromDate && parsedToDate) {
      dateFilter.bookingDate = {
        gte: dateFns.startOfDay(parsedFromDate),
        lte: dateFns.endOfDay(parsedToDate),
      };
    } else if (parsedFromDate) {
      dateFilter.bookingDate = { gte: dateFns.startOfDay(parsedFromDate) };
    } else if (parsedToDate) {
      dateFilter.bookingDate = { lte: dateFns.endOfDay(parsedToDate) };
    }

    let where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(isPremium !== undefined && { customer: { isPremium } }),
      ...(centerId && { centerId }),
      ...(shiftId && { shiftId }),
      ...(parsedBookingDate && {
        bookingDate: {
          gte: dateFns.startOfDay(parsedBookingDate),
          lte: dateFns.endOfDay(parsedBookingDate),
        },
      }),
      ...dateFilter,
      ...buildBookingSearch(search),
    };

    switch (user.role) {
      case AccountRole.CUSTOMER:
        where = { ...where, customerId: user.sub };
        break;
      case AccountRole.STAFF:
        return this.staffBookingService.getBookings(filterOptions, user);
      case AccountRole.ADMIN:
      default:
        break;
    }
    const [totalItems, bookings] = await this.prismaService.$transaction([
      this.prismaService.booking.count({ where }),
      this.prismaService.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: buildBookingOrderBy(sortBy, orderBy),
        include: {
          customer: {
            include: { account: true },
          },
          vehicle: {
            include: { vehicleModel: { include: { brand: true } } },
          },
          serviceCenter: true,
          shift: true,
          bookingDetails: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: bookings.map(booking => this.transformBookingByRole(booking, user.role)),
      page,
      pageSize,
      total: totalItems,
      totalPages,
    };
  }

  async cancelBooking(bookingId: string, user: JWT_Payload): Promise<BookingDTO> {
    const booking = await this.prismaService.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Booking is already cancelled');

    const CAN_CANCEL: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.ASSIGNED];
    if (!CAN_CANCEL.includes(booking.status))
      throw new BadRequestException('Only pending bookings can be cancelled');

    if (user.role === AccountRole.CUSTOMER && booking.customerId !== user.sub)
      throw new BadRequestException('You can only cancel your own bookings');

    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    return plainToInstance(BookingDTO, updatedBooking, { excludeExtraneousValues: true });
  }

  async updateBooking(
    bookingId: string,
    body: CustomerUpdateBookingDTO | StaffUpdateBookingDTO | AdminUpdateBookingDTO,
    user: JWT_Payload
  ) {
    switch (user.role) {
      case AccountRole.CUSTOMER:
        const updatedBody = plainToInstance(CustomerUpdateBookingDTO, body);
        return this.customerBookingService.updateBooking(bookingId, user.sub, updatedBody);
      case AccountRole.STAFF:
        const staffBody = plainToInstance(StaffUpdateBookingDTO, body);
        return this.staffBookingService.updateBooking(bookingId, staffBody);
      case AccountRole.ADMIN:
        const updatedAdminBody = plainToInstance(AdminUpdateBookingDTO, body);
        return this.adminBookingService.updateBooking(bookingId, updatedAdminBody);
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  async getCustomerBookingHistory(user: JWT_Payload, filterOptions: BookingHistoryQueryDTO) {
    const {
      search,
      status,
      bookingDate,
      centerId,
      shiftId,
      page = 1,
      pageSize = 10,
      orderBy = 'desc',
      sortBy = 'createdAt',
      fromDate,
      toDate,
      isPremium,
      customerId,
      vehicleId,
    } = filterOptions;

    // Convert string dates to Date objects for database comparison
    const dateFilter: Prisma.BookingWhereInput = {};
    const parsedFromDate = fromDate ? parseDate(fromDate) : null;
    const parsedToDate = toDate ? parseDate(toDate) : null;
    const parsedBookingDate = bookingDate ? parseDate(bookingDate) : null;

    if (parsedFromDate && parsedToDate) {
      dateFilter.bookingDate = {
        gte: dateFns.startOfDay(parsedFromDate),
        lte: dateFns.endOfDay(parsedToDate),
      };
    } else if (parsedFromDate) {
      dateFilter.bookingDate = { gte: dateFns.startOfDay(parsedFromDate) };
    } else if (parsedToDate) {
      dateFilter.bookingDate = { lte: dateFns.endOfDay(parsedToDate) };
    }

    let where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(isPremium !== undefined && { customer: { isPremium } }),
      ...(centerId && { centerId }),
      ...(shiftId && { shiftId }),
      ...(customerId && { customerId }),
      ...(vehicleId && { vehicleId }),
      ...(parsedBookingDate && {
        bookingDate: {
          gte: dateFns.startOfDay(parsedBookingDate),
          lte: dateFns.endOfDay(parsedBookingDate),
        },
      }),
      ...dateFilter,
      ...buildBookingSearch(search),
    };

    if (!status) {
      where.status = { in: ['CANCELLED', 'CHECKED_OUT'] };
    }
    switch (user.role) {
      case AccountRole.CUSTOMER:
        where = { ...where, customerId: user.sub };
        break;
      case AccountRole.STAFF:
        const staff = await this.prismaService.employee.findFirst({
          where: { accountId: user.sub },
          select: {
            workCenters: {
              where: { endDate: null },
              select: { centerId: true },
              take: 1,
            },
          },
        });

        if (!staff) {
          throw new BadRequestException('Staff not found');
        }

        where = {
          ...where,
          centerId: staff.workCenters[0]?.centerId,
        };
        break;
      default:
        break;
    }
    const [totalItems, bookings] = await this.prismaService.$transaction([
      this.prismaService.booking.count({ where }),
      this.prismaService.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: buildBookingOrderBy(sortBy, orderBy),
        include: {
          customer: {
            include: { account: true },
          },
          vehicle: {
            include: { vehicleModel: { include: { brand: true } } },
          },
          serviceCenter: true,
          shift: true,
          bookingDetails: true,
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: bookings.map(booking => plainToInstance(BookingHistoryDTO, booking)),
      page,
      pageSize,
      total: totalItems,
      totalPages,
    };
  }
}
