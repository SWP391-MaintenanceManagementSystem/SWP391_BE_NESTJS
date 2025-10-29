import { Expose, Transform, Type } from 'class-transformer';

export class MessageSenderDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;
}

export class MessageReceiverDTO {
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
  @Transform(({ obj }) => ({
    id: obj.sender.id,
    email: obj.sender.email,
    firstName: obj.sender.customer?.firstName || obj.sender.employee?.firstName,
    lastName: obj.sender.customer?.lastName || obj.sender.employee?.lastName,
  }))
  @Type(() => MessageSenderDTO)
  sender: MessageSenderDTO;

  @Expose()
  @Transform(({ obj }) => ({
    id: obj.receiver.id,
    email: obj.receiver.email,
    firstName: obj.receiver.customer?.firstName || obj.receiver.employee?.firstName,
    lastName: obj.receiver.customer?.lastName || obj.receiver.employee?.lastName,
  }))
  @Type(() => MessageReceiverDTO)
  receiver: MessageReceiverDTO;
}
