import { Expose, Transform, Type } from 'class-transformer';
import { MessageReceiverDTO, MessageSenderDTO } from './message.dto';

export class ConversationCustomerDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;
}

export class ConversationStaffDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;
}

export class MessageDTO {
  @Expose()
  id: string;

  @Expose()
  conversationId?: string;

  @Expose()
  content: string;

  @Expose()
  @Type(() => Date)
  sentAt: Date;

  @Expose()
  senderId: string;

  @Expose()
  receiverId: string;

  @Expose()
  @Type(() => MessageSenderDTO)
  sender: MessageSenderDTO;

  @Expose()
  @Type(() => MessageReceiverDTO)
  receiver: MessageReceiverDTO;
}

export class ConversationDTO {
  @Expose()
  id: string;

  @Expose()
  customerId: string;

  @Expose()
  staffId?: string;

  @Expose()
  status: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => ({
    id: obj.customer.id,
    email: obj.customer.email,
    firstName: obj.customer?.firstName || '',
    lastName: obj.customer.customer?.lastName || '',
  }))
  @Type(() => ConversationCustomerDTO)
  customer: ConversationCustomerDTO;

  @Expose()
  @Transform(({ obj }) =>
    obj.employee
      ? {
          id: obj.id,
          email: obj.email,
          firstName: obj.employee.firstName || '',
          lastName: obj.employee.lastName || '',
        }
      : undefined
  )
  @Type(() => ConversationStaffDTO)
  staff?: ConversationStaffDTO;

  @Expose()
  @Type(() => MessageDTO)
  messages?: MessageDTO[];
}
