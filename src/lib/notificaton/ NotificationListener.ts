import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_TYPES } from 'src/common/interface/events.name';

import type {
  CustomerInquiryAlertEvent,
  MessageEvent,
  ProductApproveUpdateEvent,
  UserRegistrationEvent,
} from 'src/common/interface/events-payload';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationGateway: NotificationGateway) {}

  /**
   * Handles CustomerInquiryAlert creation events
   * Sends real-time notifications to all recipients via WebSocket
   */
  @OnEvent(EVENT_TYPES.CustomerInquiryAlert_CREATE)
  async handleCustomerInquiryCreate(payload: CustomerInquiryAlertEvent) {
    this.logger.log(
      `📨 Customer Inquiry Alert: ${payload.meta.senderEmail} - ${payload.meta.title}`,
    );

    const notification = {
      type: 'CustomerInquiryAlert',
      title: `New Inquiry: ${payload.meta.title}`,
      message: payload.meta.message,
      createdAt: new Date(),
      meta: {
        senderEmail: payload.meta.senderEmail,
        subject: payload.info.subject,
        date: payload.info.date,
      },
    };

    // Send to all recipients who have CustomerInquiryAlert enabled
    const recipientIds = payload.info.recipients.map((r) => r.id);
    await this.notificationGateway.notifyMultipleUsers(
      recipientIds,
      'customer-inquiry-alert',
      notification,
    );

    this.logger.log(
      `✅ Notified ${recipientIds.length} user(s) about new inquiry`,
    );
  }

  /**
   * Handles UserRegistration events
   */
  @OnEvent(EVENT_TYPES.USERREGISTRATION_CREATE)
  async handleUserRegistration(payload: UserRegistrationEvent) {
    this.logger.log(`👤 New User Registration: ${payload.info.email}`);

    const notification = {
      type: 'UserRegistration',
      title: 'New User Registered',
      message: `${payload.info.name || payload.info.email} has registered`,
      createdAt: new Date(),
      meta: {
        userId: payload.info.id,
        email: payload.info.email,
        role: payload.info.role,
      },
    };

    const recipientIds = payload.info.recipients.map((r) => r.id);
    await this.notificationGateway.notifyMultipleUsers(
      recipientIds,
      'user-registration',
      notification,
    );

    this.logger.log(
      `✅ Notified ${recipientIds.length} admin(s) about new registration`,
    );
  }

  /**
   * Handles new message events
   */
  @OnEvent(EVENT_TYPES.NewMessageMeta_CREATE)
  async handleNewMessage(payload: MessageEvent) {
    this.logger.log(
      `💬 New Message from ${payload.info.fromUserId} to ${payload.info.toUserId}`,
    );

    const notification = {
      type: 'NewMessage',
      title: 'New Message Received',
      message: payload.meta.message,
      createdAt: new Date(),
      meta: {
        messageId: payload.info.messageId,
        fromUserId: payload.info.fromUserId,
        toUserId: payload.info.toUserId,
      },
    };

    const recipientIds = payload.info.recipients.map((r) => r.id);
    await this.notificationGateway.notifyMultipleUsers(
      recipientIds,
      'new-message',
      notification,
    );
  }

  /**
   * Handles product approval/rejection events
   */
  @OnEvent(EVENT_TYPES.productApproveUpdateMeta_UPDATE)
  async handleProductApprovalUpdate(payload: ProductApproveUpdateEvent) {
    this.logger.log(
      `📦 Product ${payload.info.productId} ${payload.info.status}`,
    );

    const notification = {
      type: 'ProductApproveUpdate',
      title: `Product ${payload.info.status}`,
      message: `Your product has been ${payload.info.status.toLowerCase()}`,
      createdAt: new Date(),
      meta: {
        productId: payload.info.productId,
        approverId: payload.info.approverId,
        status: payload.info.status,
      },
    };

    const recipientIds = payload.info.recipients.map((r) => r.id);
    await this.notificationGateway.notifyMultipleUsers(
      recipientIds,
      'product-approve-update',
      notification,
    );
  }
}
