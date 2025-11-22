import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import {
  NotificationMetadata,
  NotificationItem,
} from 'src/common/decorator/emit-notification.decorator';

@Injectable()
export class NotificationTemplateService {
  static newBookingForStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'New Booking Assignment',
      message: data => {
        const booking = data.data;
        const bookingId = booking.id?.slice(0, 8) || 'N/A';
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        const time = new Date(booking.bookingDate).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const centerName = booking.serviceCenter?.name || 'your center';
        const shiftName = booking.shift?.name || 'your shift';

        return `New booking #${bookingId} at ${centerName} for ${date}, ${shiftName} (${time}).`;
      },
      targetUserIdField: 'staffIds',
    };
  }

  static bookingCreatedWithStaff(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Created Successful',
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Your booking #${booking.id.slice(0, 8)} for ${date} has been created successfully.`;
      },
      targetUserIdField: 'customerId',

      additional: [this.newBookingForStaff()],
    };
  }

  // Booking assignment notification (both customer and technician receive)
  static bookingAssignedWithTechnician(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Assigned to Technician',
      message: data => {
        const booking = data.data.booking;
        const assignedByInfo = data.assignedByInfo || {};

        const bookingId = booking?.id || 'N/A';
        const bookingDate = booking?.bookingDate
          ? new Date(booking.bookingDate).toLocaleDateString('vi-VN')
          : 'N/A';

        const staffName = assignedByInfo.firstName
          ? `${assignedByInfo.firstName} ${assignedByInfo.lastName || ''}`.trim()
          : 'Staff';

        return `Your booking #${bookingId.slice(0, 8)} has been assigned to technicians by ${staffName} on ${bookingDate}.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.technicianAssignedToBooking()],
    };
  }

  static technicianAssignedToBooking(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Assigned to Booking',
      message: data => {
        const booking = data.data.booking;
        const assignedByInfo = data.assignedByInfo || {};

        const bookingId = booking?.id || 'N/A';
        const bookingDate = booking?.bookingDate
          ? new Date(booking.bookingDate).toLocaleDateString('vi-VN')
          : 'N/A';

        const staffName = assignedByInfo.firstName
          ? `${assignedByInfo.firstName} ${assignedByInfo.lastName || ''}`.trim()
          : 'Staff';

        return `You have been assigned to booking #${bookingId.slice(0, 8)} by ${staffName} on ${bookingDate}.`;
      },
      targetUserIdField: 'employeeIds',
    };
  }

  static bookingCompleted(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Completed',
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been completed. Please check the details and check-out.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.notiBookingCompletedforStaff()],
    };
  }

  static notiBookingCompletedforStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Completed',
      message: data => {
        const booking = data.data;
        return `Booking #${booking.id.slice(0, 8)} has been marked as completed.`;
      },
      targetUserIdField: 'staffIds',
    };
  }

  static bookingCancelled(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Cancelled',
      message: data => {
        const booking = data.data;
        const cancelledBy = data.cancelledBy;
        const cancellerInfo = data.cancellerInfo || {};
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');

        if (cancelledBy === 'CUSTOMER') {
          return `Your booking #${booking.id.slice(0, 8)} on ${date} has been cancelled.`;
        } else {
          const staffName = cancellerInfo.firstName
            ? `${cancellerInfo.firstName} ${cancellerInfo.lastName || ''}`.trim()
            : 'Staff';

          return `Your booking #${booking.id.slice(0, 8)} on ${date} has been cancelled by ${staffName}.`;
        }
      },
      targetUserIdField: 'customerId',
      additional: [this.notiBookingCancelledForStaff()],
    };
  }

  static notiBookingCancelledForStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Cancelled',
      message: data => {
        const booking = data.data;
        const cancelledBy = data.cancelledBy;
        const cancellerInfo = data.cancellerInfo || {};
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');

        if (cancelledBy === 'CUSTOMER') {
          const customerName = cancellerInfo.firstName
            ? `${cancellerInfo.firstName} ${cancellerInfo.lastName || ''}`.trim()
            : 'Customer';

          return `Booking #${booking.id.slice(0, 8)} on ${date} has been cancelled by ${customerName}.`;
        } else {
          const staffName = cancellerInfo.firstName
            ? `${cancellerInfo.firstName} ${cancellerInfo.lastName || ''}`.trim()
            : 'Staff member';

          return `Booking #${booking.id.slice(0, 8)} on ${date} has been cancelled by ${staffName}.`;
        }
      },
      targetUserIdField: 'staffIds',
    };
  }

  // Payment Notifications for Customer
  static paymentSuccess(): NotificationMetadata {
    return {
      type: NotificationType.PAYMENT,
      title: 'Payment Successful',
      message: data => {
        const transaction = data.data;
        return `Your payment of ${transaction.amount.toLocaleString('vi-VN')} has been processed successfully.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  static paymentFailed(): NotificationMetadata {
    return {
      type: NotificationType.PAYMENT,
      title: 'Payment Failed',
      message: data => {
        const transaction = data.data;
        return `Your payment of ${transaction.amount.toLocaleString('vi-VN')} VND has failed. Please try again.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  // Shift Schedule Notifications (for Employee)
  static workScheduleAssigned(): NotificationMetadata {
    return {
      type: NotificationType.SHIFT,
      title: 'New Work Schedule Assigned',
      message: data => {
        const schedules = data.schedules;
        if (!Array.isArray(schedules) || schedules.length === 0) {
          return 'You have been assigned a new work schedule.';
        }

        const dates = schedules
          .map(s => new Date(s.date))
          .sort((a, b) => a.getTime() - b.getTime())
          .map(d => d.toLocaleDateString('vi-VN'))
          .join(', ');

        const shiftName = schedules[0].shift?.name || 'a shift';

        if (schedules.length === 1) {
          return `You have been assigned to ${shiftName} on ${dates}.`;
        }
        return `You have been assigned to ${shiftName} on ${schedules.length} dates: ${dates}.`;
      },
      targetUserIdField: 'employeeIds',
    };
  }

  static shiftUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SHIFT,
      title: 'Shift Updated',
      message: data => {
        const schedule = data.data;
        const date = new Date(schedule.date).toLocaleDateString('vi-VN');
        const shiftName = schedule.shift?.name || 'a shift';
        return `Your shift assignment has been updated: ${shiftName} on ${date}.`;
      },
      targetUserIdField: 'data.employeeId', // Single employee
    };
  }

  static shiftCancelled(): NotificationMetadata {
    return {
      type: NotificationType.SHIFT,
      title: 'Shift Cancelled',
      message: data => {
        const schedule = data.data;
        const date = new Date(schedule.date).toLocaleDateString('vi-VN');
        return `Your shift on ${date} has been cancelled.`;
      },
      targetUserIdField: 'data.employeeId',
    };
  }

  static technicianUnassignedFromBooking(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Unassigned from Booking',
      message: data => {
        const assignment = data.data;
        const bookingId = assignment.booking?.id || assignment.bookingId || 'N/A';
        return `You have been unassigned from booking #${bookingId.slice(0, 8)}.`;
      },
      targetUserIdField: 'data.employeeId',
    };
  }

  // Check-in form notification (Customer and Technician)
  static vehicleHandoverCreated(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Vehicle Check-In Completed',
      message: () => {
        return `Vehicle Check-In completed. Check your booking for details.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.notiCheckInForTechnician()],
    };
  }

  static notiCheckInForTechnician(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Vehicle Check-In Completed',
      message: data => {
        const handover = data.data; // ← handoverDTO
        const booking = handover.booking; // ← booking nằm trong handover
        const bookingId = booking?.id?.slice(0, 8) || 'N/A';
        const bookingDate = booking?.bookingDate
          ? new Date(booking.bookingDate).toLocaleDateString('vi-VN')
          : 'N/A';
        return `Vehicle Check-In completed for booking #${bookingId} on ${bookingDate}.`;
      },
      targetUserIdField: 'technicianIds',
    };
  }

  static bookingInProgress(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking In Progress',
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} is now in progress.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.notiBookingInProgressForStaff()],
    };
  }

  static notiBookingInProgressForStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking In Progress',
      message: data => {
        const booking = data.data;
        return `Booking #${booking.id.slice(0, 8)} is now in progress.`;
      },
      targetUserIdField: 'staffIds',
    };
  }

  // employee assign center notifications (Employee)
  static employeeAssignedToCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      title: 'Assigned to new Service Center',
      message: data => {
        const centerName = data.newCenterName || 'a service center';
        return `You have been assigned to ${centerName}.`;
      },
    };
  }

  static employeeRemovedFromCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      title: 'Removed from old Service Center',
      message: data => {
        const centerName = data.oldCenterName || 'your current service center';
        return `You have been removed from ${centerName}.`;
      },
    };
  }

  static employeeProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      title: 'Profile Updated by Admin',
      message: () => 'Your profile has been updated by an administrator.',
    };
  }

  // customer profile updated notification
  static customerProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      title: 'Profile Updated Successfully',
      message: () => 'Your profile has been updated successfully.',
      targetUserIdField: 'data.id',
    };
  }

  // System Maintenance Notification (All Users)
  static systemMaintenance(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      title: 'System Maintenance Notification',
      message: data => data.message || 'System maintenance scheduled. Please check for updates.',
      // No targetUserIdField = send to current user
    };
  }

  static partRefillRequested(): NotificationMetadata {
    return {
      type: NotificationType.PART,
      title: 'Part Refill Request',
      message: data => {
        const part = data.part || {};
        const technician = data.technician || {};
        const refillAmount = data.refillAmount || 0;

        const technicianName = technician.firstName
          ? `${technician.firstName} ${technician.lastName || ''}`.trim()
          : 'A technician';

        const partName = part.name || 'Unknown Part';
        const currentStock = part.stock ?? part.quantity ?? 0;
        const minStock = part.minStock ?? 0;

        return `${technicianName} requested refill ${refillAmount} units for part "${partName}" (Current stock: ${currentStock}, Min: ${minStock}).`;
      },
      targetUserIdField: 'adminIds',
    };
  }

  static partRefillApproved(): NotificationMetadata {
    return {
      type: NotificationType.PART,
      title: 'Refill Request Approved',
      message: data => {
        const part = data.part || {};
        const refillAmount = data.refillAmount || 0;
        const newStock = data.newStock ?? part.quantity ?? part.stock ?? 0;

        const partName = part.name || 'Unknown Part';

        return `Your refill request for "${partName}" has been approved. ${refillAmount} units added. New stock: ${newStock}.`;
      },
      targetUserIdField: 'technicianId',
    };
  }

  static staffUpdateBooking(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Updated by Staff',
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Booking #${booking.id.slice(0, 8)} for ${date} has been updated successfully. Please check the details.`;
      },
      targetUserIdField: 'staffIds',
      additional: [this.notiCustomerBookingUpdatedByStaff()],
    };
  }

  static notiCustomerBookingUpdatedByStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Updated by Staff',
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        const staff = data.staff || {};
        const staffName = staff.firstName
          ? `${staff.firstName} ${staff.lastName || ''}`.trim()
          : 'A staff member';
        return `Booking #${booking.id.slice(0, 8)} for ${date} has been updated by ${staffName}. Please check the details.`;
      },
      targetUserIdField: 'customerId',
    };
  }

  static customerUpdateBooking(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Updated by Customer',
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Booking #${booking.id.slice(0, 8)} for ${date} has been updated successfully. Please check the details.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.notiStaffBookingUpdatedByCustomer()],
    };
  }

  static notiStaffBookingUpdatedByCustomer(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Updated by Customer',
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        const customer = data.customer || {};
        const customerName = customer.firstName
          ? `${customer.firstName} ${customer.lastName || ''}`.trim()
          : 'A customer';
        return `Booking #${booking.id.slice(0, 8)} for ${date} has been updated by ${customerName}. Please check the details.`;
      },
      targetUserIdField: 'staffIds',
    };
  }
}
