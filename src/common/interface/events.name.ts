// Event payload interfaces (aligned with NotificationToggle schema)

export interface CustomerInquiryAlertMeta {
  title: string;
  message: string;
  senderEmail: string;
  date: string;
}

export interface NewMessageMeta {
  userId: string;
  message: string;
  sentAt: Date;
}

export interface ProductApproveUpdateMeta {
  productId: string;
  approverId: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  date: string;
}

export interface UserRegistrationMeta {
  userId: string;
  userName?: string;
  registeredAt: Date;
}

export interface MessageMeta {
  messageId: string;
  fromUserId: string;
  toUserId: string;
  sentAt: Date;
}

// EVENT TYPE CONSTANTS
export const EVENT_TYPES = {
  USERREGISTRATION_CREATE: 'user.create',
  USERREGISTRATION_UPDATE: 'user.update',
  USERREGISTRATION_DELETE: 'user.delete',

  CustomerInquiryAlert_CREATE: 'customer-inquiry-alert.create',
  CustomerInquiryAlert_UPDATE: 'customer-inquiry-alert.update',
  CustomerInquiryAlert_DELETE: 'customer-inquiry-alert.delete',

  NewMessageMeta_CREATE: 'new-message.create',
  NewMessageMeta_UPDATE: 'new-message.update',
  NewMessageMeta_DELETE: 'new-message.delete',

  productApproveUpdateMeta_UPDATE: 'product-approve-update.update',

  MESSAGE_CREATE: 'message.create',
} as const;

// Type-safe keys
export type EventType = keyof typeof EVENT_TYPES;

// Event payload mapping
export type EventPayloadMap = {
  [EVENT_TYPES.USERREGISTRATION_CREATE]: UserRegistrationMeta;
  [EVENT_TYPES.USERREGISTRATION_UPDATE]: UserRegistrationMeta;
  [EVENT_TYPES.USERREGISTRATION_DELETE]: UserRegistrationMeta;

  [EVENT_TYPES.CustomerInquiryAlert_CREATE]: CustomerInquiryAlertMeta;
  [EVENT_TYPES.CustomerInquiryAlert_UPDATE]: CustomerInquiryAlertMeta;
  [EVENT_TYPES.CustomerInquiryAlert_DELETE]: CustomerInquiryAlertMeta;

  [EVENT_TYPES.NewMessageMeta_CREATE]: NewMessageMeta;
  [EVENT_TYPES.NewMessageMeta_UPDATE]: NewMessageMeta;
  [EVENT_TYPES.NewMessageMeta_DELETE]: NewMessageMeta;

  [EVENT_TYPES.productApproveUpdateMeta_UPDATE]: ProductApproveUpdateMeta;
  [EVENT_TYPES.MESSAGE_CREATE]: MessageMeta;
};
