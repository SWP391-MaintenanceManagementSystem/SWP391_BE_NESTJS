// src/modules/notification/notification-template.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationMetadata } from 'src/common/decorator/emit-notification.decorator';

@Injectable()
export class NotificationTemplateService {
  /**
   * ========================================
   * BOOKING NOTIFICATIONS (for Customer)
   * ========================================
   */
  static bookingCreated(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Your booking #${booking.id.slice(0, 8)} for ${date} has been created successfully.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer receives notification
    };
  }

  static bookingAssigned(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been assigned to a technician.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  static bookingCompleted(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been completed. Thank you for using our service!`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  static bookingCancelled(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const booking = data.data;
        return `Your booking #${booking.id.slice(0, 8)} has been cancelled.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
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
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  /**
   * ========================================
   * PAYMENT NOTIFICATIONS (for Customer)
   * ========================================
   */
  static paymentSuccess(): NotificationMetadata {
    return {
      type: NotificationType.PAYMENT,
      message: data => {
        const transaction = data.data;
        return `Your payment of ${transaction.amount.toLocaleString('vi-VN')} VND has been processed successfully.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  static paymentFailed(): NotificationMetadata {
    return {
      type: NotificationType.PAYMENT,
      message: data => {
        const transaction = data.data;
        return `Your payment of ${transaction.amount.toLocaleString('vi-VN')} VND has failed. Please try again.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  /**
   * ========================================
   * WORK SCHEDULE NOTIFICATIONS (for Employee - Technician/Staff)
   * ========================================
   */
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
      targetUserIdField: 'data[].employeeId', // ✅ Multiple employees (array)
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
      targetUserIdField: 'data.employeeId', // ✅ Single employee
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
      targetUserIdField: 'data.employeeId', // ✅ Single employee
    };
  }

  /**
   * ========================================
   * BOOKING ASSIGNMENT NOTIFICATIONS (for Technician)
   * ========================================
   */
  static technicianAssignedToBooking(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const assignment = data.data;
        const bookingId = assignment.booking?.id || assignment.bookingId || 'N/A';
        return `You have been assigned to booking #${bookingId.slice(0, 8)}.`;
      },
      targetUserIdField: 'data.employeeId', // ✅ Technician receives notification
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
      targetUserIdField: 'data.employeeId', // ✅ Technician
    };
  }

  /**
   * ========================================
   * VEHICLE HANDOVER NOTIFICATIONS (for Customer)
   * ========================================
   */
  static vehicleHandoverCreated(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      message: data => {
        const handover = data.data;
        return `Vehicle handover completed. Odometer: ${handover.odometer} km. Check your booking for details.`;
      },
      targetUserIdField: 'data.booking.customerId', // ✅ Customer (nested field)
    };
  }

  /**
   * ========================================
   * MEMBERSHIP NOTIFICATIONS (for Customer)
   * ========================================
   */
  static membershipActivated(): NotificationMetadata {
    return {
      type: NotificationType.MEMBERSHIP,
      message: data => {
        const subscription = data.data;
        const endDate = new Date(subscription.endDate).toLocaleDateString('vi-VN');
        return `Your premium membership has been activated! Valid until ${endDate}.`;
      },
      targetUserIdField: 'data.customerId', // ✅ Customer
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
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  static membershipExpired(): NotificationMetadata {
    return {
      type: NotificationType.MEMBERSHIP,
      message: () => 'Your premium membership has expired. Renew now to restore your benefits!',
      targetUserIdField: 'data.customerId', // ✅ Customer
    };
  }

  /**
   * ========================================
   * EMPLOYEE WORK CENTER NOTIFICATIONS (for Employee - Technician/Staff)
   * ========================================
   */
  static employeeAssignedToCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: data => {
        const result = data.data;
        const centerName = result.workCenter?.name || 'a service center';
        return `You have been assigned to ${centerName}.`;
      },
      targetUserIdField: 'data.employeeId', // ✅ Employee (technician/staff)
    };
  }

  static employeeRemovedFromCenter(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'You have been removed from your current service center assignment.',
      targetUserIdField: 'data.employeeId', // ✅ Employee
    };
  }

  static employeeProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'Your profile has been updated by an administrator.',
      targetUserIdField: 'data.id', // ✅ Employee account ID
    };
  }

  /**
   * ========================================
   * CUSTOMER PROFILE NOTIFICATIONS (for Customer)
   * ========================================
   */
  static customerProfileUpdated(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: () => 'Your profile has been updated successfully.',
      targetUserIdField: 'data.id', // ✅ Customer account ID
    };
  }

  /**
   * ========================================
   * SYSTEM NOTIFICATIONS
   * ========================================
   */
  static systemMaintenance(): NotificationMetadata {
    return {
      type: NotificationType.SYSTEM,
      message: data => data.message || 'System maintenance scheduled. Please check for updates.',
      // No targetUserIdField = send to current user
    };
  }
}
