// src/common/interface/notification-payload.ts
import { NotificationType } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meta: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}
