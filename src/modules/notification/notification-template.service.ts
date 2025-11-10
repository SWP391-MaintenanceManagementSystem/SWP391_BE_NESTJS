import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { add } from 'date-fns/add';
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
      title: 'Booking Created Successful',
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

  // Booking Notification for Customer (customer receive)
  static bookingAssigned(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Assigned to Technician',
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
      title: 'Booking Assigned to Technician',
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
      title: 'Booking Completed',
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
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Your booking #${booking.id.slice(0, 8)} on ${date} has been cancelled.`;
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
        const date = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
        return `Booking #${booking.id.slice(0, 8)} on ${date} has been cancelled.`;
      },
      targetUserIdField: 'staffIds',
    };
  }

  static bookingStatusUpdate(): NotificationMetadata {
    return {
      type: NotificationType.BOOKING,
      title: 'Booking Status Updated',
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

  // Booking assignment notification (technician receive)
  static technicianAssignedToBooking(): NotificationItem {
    return {
      type: NotificationType.BOOKING,
      title: 'Assigned to Booking',
      message: data => {
        const assignment = data.data.assignments[0];
        const bookingId = assignment.booking?.id || assignment.bookingId || 'N/A';
        const bookingDate = assignment.booking?.bookingDate
          ? new Date(assignment.booking.bookingDate).toLocaleDateString('vi-VN')
          : 'N/A';
        return `You have been assigned to booking #${bookingId.slice(0, 8)} on ${bookingDate}.`;
      },
      targetUserIdField: 'employeeIds',
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
}
