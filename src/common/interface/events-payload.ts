// -----------basic events payload interfaces -----------

import {
  CustomerInquiryAlertMeta,
  NewMessageMeta,
  ProductApproveUpdateMeta,
  UserRegistrationMeta,
} from './events.name';

// ------------Generic Event Payload Interface-----------
export interface BaseEvent<TMeta> {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  meta: TMeta;
}

// Notification Base
export interface Notification {
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  meta: Record<string, any>;
}
// User Registration Event
export interface UserRegistrationEvent extends BaseEvent<UserRegistrationMeta> {
  info: {
    email: string;
    id: string;
    name: string;
    role: string;
    recipients: { id: string; email: string }[];
  };
}

export interface CustomerInquiryAlertEvent extends BaseEvent<CustomerInquiryAlertMeta> {
  info: {
    Id: string;
    subject: string;
    message: string;
    date: string;
    recipients: { id: string; email: string }[];
  };
}

export interface MessageEvent extends BaseEvent<NewMessageMeta> {
  info: {
    messageId: string;
    fromUserId: string;
    toUserId: string;
    recipients: { id: string; email: string }[];
  };
}

export interface ProductApproveUpdateEvent extends BaseEvent<ProductApproveUpdateMeta> {
  info: {
    productId: string;
    approverId: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    recipients: { id: string; email: string }[];
  };
}
