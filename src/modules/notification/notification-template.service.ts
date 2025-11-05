import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import {
  NotificationMetadata,
  NotificationItem,
} from 'src/common/decorator/emit-notification.decorator';

@Injectable()
export class NotificationTemplateService {
  // Booking Notification for Customer
  static bookingCreated(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Your booking #${booking.id.slice(0, 8)} for ${date} has been created successfully.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  // 2. Chỉ gửi cho STAFF (dùng trong additional)
  static newBookingForStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data; // ← dùng data.data để đồng nhất
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

  // 3. GỬI CẢ CUSTOMER + STAFF (1 decorator)
  static bookingCreatedWithStaff(): NotificationMetadata {
    return {
      // Gửi cho customer
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Your booking #${booking.id.slice(0, 8)} for ${date} has been created successfully.`;
      },
      targetUserIdField: 'customerId',

      // Gửi cho staff
      additional: [this.newBookingForStaff()], // ← reuse function
    };
  }

  // 4. CHỈ GỬI CHO STAFF (không gửi customer)
  static onlyStaffNewBooking(): NotificationMetadata {
    return {
      additional: [this.newBookingForStaff()],
    };
  }

  // Booking Notification for Customer (customer receive)
  static bookingAssigned(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been assigned to a technician.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  // Booking assignment notification (both customer and technician receive)
  static bookingAssignedWithTechnician(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const bookingId = data.data.booking?.id || 'N/A';
        return `Your booking #${bookingId.slice(0, 8)} has been assigned to technicians.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.technicianAssignedToBooking()],
    };
  }

  static bookingCompleted(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been completed. Please check the details and check-out.`;
      },
      targetUserIdField: 'customerId',
      additional: [this.NotiBookingCompletedforStaff()],
    };
  }

  static NotiBookingCompletedforStaff(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
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
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been cancelled.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  static bookingStatusUpdate(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        const statusMap: Record<string, string> = {
          PENDING: 'is pending confirmation',
          ASSIGNED: 'has been assigned to a technician',
          CHECKED_IN: 'vehicle has been checked in',
          IN_PROGRESS: 'is in progress',
          CHECKED_OUT: 'vehicle has been checked out',
          COMPLETED: 'has been completed',
          CANCELLED: 'has been cancelled',
        };
        const statusText = statusMap[booking.status as keyof typeof statusMap] || booking.status;
        return `Your booking #${booking.id.slice(0, 8)} ${statusText}.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  // Payment Notifications for Customer
  static paymentSuccess(): NotificationMetadata {
    return {
      type: NotificationType.PAYMENT,
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
      message: data => {
        const transaction = data.data;
        return `Your payment of ${transaction.amount.toLocaleString('vi-VN')} VND has failed. Please try again.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  // Shift Schedule Notifications (for Employee)
  static shiftAssigned(): NotificationMetadata {
    return {
      type: NotificationType.SHIFT,
      message: data => {
        const schedules = data.data;
        if (Array.isArray(schedules) && schedules.length > 0) {
          const first = schedules[0];
          const date = new Date(first.date).toLocaleDateString('vi-VN');
          const shiftName = first.shift?.name || 'a shift';
          return `You have been assigned to ${shiftName} on ${date}.`;
        }
        return 'You have been assigned a new work schedule.';
      },
      targetUserIdField: 'data[].employeeId', // Multi-employee
    };
  }

  static shiftUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SHIFT,
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
      message: data => {
        const schedule = data.data;
        const date = new Date(schedule.date).toLocaleDateString('vi-VN');
        return `Your shift on ${date} has been cancelled.`;
      },
      targetUserIdField: 'data.employeeId',
    };
  }

  // Booking assignment notification (technician receive)
  static technicianAssignedToBooking(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const assignment = data.data.assignments[0];
        const bookingId = assignment.booking?.id || assignment.bookingId || 'N/A';
        const bookingDate = assignment.booking?.bookingDate
          ? new Date(assignment.booking.bookingDate).toLocaleDateString('vi-VN')
          : 'N/A';
        return `You have been assigned to booking #${bookingId.slice(0, 8)} on ${bookingDate}.`;
      },
      targetUserIdField: 'employeeIds', // ← response có employeeIds
    };
  }

  static technicianUnassignedFromBooking(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const assignment = data.data;
        const bookingId = assignment.booking?.id || assignment.bookingId || 'N/A';
        return `You have been unassigned from booking #${bookingId.slice(0, 8)}.`;
      },
      targetUserIdField: 'data.employeeId',
    };
  }

  // Check-in form notification (Customer)
  static vehicleHandoverCreated(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: () => {
        return `Vehicle Check-In completed. Check your booking for details.`;
      },
      targetUserIdField: 'data.booking.customerId', // Customer (nested field)
    };
  }

  // membership notifications (Customer)
  static membershipActivated(): NotificationMetadata {
    return {
      type: NotificationType.MEMBERSHIP,
      message: data => {
        const subscription = data.data;
        const endDate = new Date(subscription.endDate).toLocaleDateString('vi-VN');
        return `Your premium membership has been activated! Valid until ${endDate}.`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  static membershipExpiringSoon(): NotificationMetadata {
    return {
      type: NotificationType.MEMBERSHIP,
      message: data => {
        const subscription = data.data;
        const endDate = new Date(subscription.endDate).toLocaleDateString('vi-VN');
        return `Your premium membership will expire on ${endDate}. Renew now to continue enjoying benefits!`;
      },
      targetUserIdField: 'data.customerId',
    };
  }

  static membershipExpired(): NotificationMetadata {
    return {
      type: NotificationType.MEMBERSHIP,
      message: () => 'Your premium membership has expired. Renew now to restore your benefits!',
      targetUserIdField: 'data.customerId',
    };
  }

  // employee assign center notifications (Employee)
  static employeeAssignedToCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: data => {
        const result = data.data;
        const centerName = result.workCenter?.name || 'a service center';
        return `You have been assigned to ${centerName}.`;
      },
      targetUserIdField: 'data.employeeId',
    };
  }

  static employeeRemovedFromCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'You have been removed from your current service center assignment.',
      targetUserIdField: 'data.employeeId',
    };
  }

  static employeeProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'Your profile has been updated by an administrator.',
      targetUserIdField: 'data.id',
    };
  }

  // customer profile updated notification
  static customerProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'Your profile has been updated successfully.',
      targetUserIdField: 'data.id',
    };
  }

  // System Maintenance Notification (All Users)
  static systemMaintenance(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: data => data.message || 'System maintenance scheduled. Please check for updates.',
      // No targetUserIdField = send to current user
    };
  }
}
