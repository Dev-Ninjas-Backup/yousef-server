import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ContactEmailTemplate } from 'src/common/email/contact';
import { UserEnum } from 'src/common/enum/user.enum';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { CustomerInquiryAlertEvent } from 'src/common/interface/events-payload';
import { EVENT_TYPES } from 'src/common/interface/events.name';
import { successResponse, TResponse } from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private eventEmitter: EventEmitter2,
  ) { }

  @HandleError('Failed to fetch custom inquiries', 'INQUIRIES')
  async getCustomInquiries(userId: string) {
    return this.prisma.contact.findMany({
      where: {
        garageOwnerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        email: true,
        subject: true,
        message: true,
        createdAt: true,
        messages: {
          where: {
            isForGrageAdmin: true,
          },
          orderBy: { createdAt: 'asc' },
          select: {
            content: true,
            isFromAdmin: true,
            createdAt: true,
          },
        },
      },
    });
  }

  @HandleError('Failed to create contact message', 'Contact')
  async createCustomInquiriesMessages(payload: CreateInquiryDto): Promise<TResponse<any>> {
    // Save inquiry to database
    const contact = await this.prisma.contact.create({
      data: {
        ...payload,
        garageOwnerId: payload.garageOwnerId
      },
    });

    // Fetch garage owner with email
    const garageOwner = await this.prisma.user.findUnique({
      where: { id: payload.garageOwnerId },
      select: { email: true },
    });

    if (!garageOwner?.email) {
      throw new AppError(404, 'Garage Owner email not found');
    }

    // ----- Send Emails -----
    await Promise.all([
      // Email to Garage Owner
      this.mailService.sendEmail(
        garageOwner.email,
        'New Inquiry Received',
        ContactEmailTemplate.contactAdmin(payload),
      ),
      // Email to Customer (Sender)
      this.mailService.sendEmail(
        payload.email,
        'We Received Your Message',
        ContactEmailTemplate.contactUser(payload),
      ),
    ]);

    // -----------------------------------------
    // ✅ FIX: Ensure notification settings exist
    // -----------------------------------------
    await this.prisma.notificationToggle.upsert({
      where: { userId: payload.garageOwnerId },
      update: {},
      create: {
        userId: payload.garageOwnerId,
        email: true,
        CustomerInquiryAlert: true,
        NewMessage: false,
        ProductApproveUpdate: false,
        message: false,
        userRegistration: false,
      },
    });

    // -----------------------------------------
    // Get users who enabled CustomerInquiryAlert notifications
    // -----------------------------------------
    const recipients = await this.prisma.notificationToggle.findMany({
      where: {
        CustomerInquiryAlert: true,
        user: {
          role: UserEnum.GARAGE_OWNER,
          id: payload.garageOwnerId,
        }
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      },
    });

    console.log('🔍 Found recipients:', recipients.length, recipients);

    // -----------------------------------------
    // ✅ FIX: Fallback if no recipients found
    // -----------------------------------------
    if (recipients.length === 0) {
      console.warn('⚠️ No recipients with CustomerInquiryAlert enabled. Adding garage owner as fallback.');
      recipients.push({
        user: {
          id: payload.garageOwnerId,
          email: garageOwner.email,
        }
      });
    }

    // -----------------------------------------
    // Create Notification entry
    // -----------------------------------------
    const notification = await this.prisma.notification.create({
      data: {
        title: `New inquiry: ${payload.FirstName} ${payload.LastName}`,
        message: `${payload.email} sent an inquiry: ${payload.message.substring(0, 50)}...`,
        type: 'CustomerInquiryAlert',
        createdAt: new Date(),
        meta: {
          id: payload.garageOwnerId,
          subject: payload.subject,
          message: payload.message,
          senderEmail: payload.email,
          senderName: `${payload.FirstName} ${payload.LastName}`,
          date: new Date().toISOString(),
        },
      },
    });

    // Create UserNotification records
    await this.prisma.$transaction(
      recipients.map((r) =>
        this.prisma.userNotification.create({
          data: {
            userId: r.user.id,
            notificationId: notification.id,
          },
        }),
      ),
    );

    // -----------------------------------------
    // Emit Event for Real-time Notification
    // -----------------------------------------
    const eventPayload: CustomerInquiryAlertEvent = {
      action: "CREATE",
      meta: {
        title: payload.subject,
        message: payload.message || "",
        senderEmail: payload.email,
        date: new Date().toISOString(),
      },
      info: {
        Id: payload.garageOwnerId,
        subject: payload.subject || "",
        message: payload.message || "",
        date: new Date().toISOString(),
        recipients: recipients.map((r) => ({
          id: r.user.id,
          email: r.user.email,
        })),
      },
    };

    this.eventEmitter.emit(EVENT_TYPES.CustomerInquiryAlert_CREATE, eventPayload);

    console.log('✅ Event emitted with', recipients.length, 'recipients');

    return successResponse(contact, 'Contact message created & emailed');
  }
}