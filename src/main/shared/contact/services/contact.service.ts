import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

import { ConfigService } from '@nestjs/config';
import { ContactSubject } from '@prisma/client';
import { ContactEmailTemplate } from 'src/common/email/contact';
import { ENVEnum } from 'src/common/enum/env.enum';
import { CreateContactDto } from '../dto/create-subscribe.dto';
import { EVENT_TYPES } from 'src/common/interface/events.name';
import { CustomerInquiryAlertEvent } from 'src/common/interface/events-payload';
import { S3FileService } from 'src/lib/s3file/s3file.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly s3FileService: S3FileService,
  ) {}
  @HandleError('Failed to create contact message', 'Contact')
  async create(
    payload: CreateContactDto,
    file?: Express.Multer.File,
  ): Promise<TResponse<any>> {
    let attachmentUrl: string | null = null;
    if (file) {
      const processedFile = await this.s3FileService.processUploadedFile(file);
      attachmentUrl = processedFile.url;
    }

    const contact = await this.prisma.contact.create({
      data: {
        FirstName: payload.FirstName,
        LastName: payload.LastName,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        phone: payload.phone || null,
        attachment: attachmentUrl,
        priceBeforeDiscount: payload.priceBeforeDiscount || null,
        priceAfterDiscount: payload.priceAfterDiscount || null,
        offerDuration: payload.offerDuration || null,
        othersubject:
          payload.subject === ContactSubject.OTHERS
            ? payload.othersubject
            : null,
        garageOwnerId: payload.garageOwnerId || null,
      },
    });

    const adminEmail = this.configService.get<string>(ENVEnum.MAIL_USER);

    if (!adminEmail) {
      this.logger.error('MAIL_USER not configured in environment');
      throw new AppError(400, 'Admin email not configured');
    }

    // ----- Send Emails (Non-blocking) -----
    try {
      // ----- Admin Notification Email -----
      await this.mailService.sendEmail(
        adminEmail,
        'New Contact Form Submission',
        ContactEmailTemplate.contactAdmin(payload),
      );

      // ----- User Confirmation Email -----
      await this.mailService.sendEmail(
        payload.email,
        'We Received Your Message',
        ContactEmailTemplate.contactUser(payload),
      );
    } catch (mailErr) {
      this.logger.error(
        'Failed to send contact form notification/confirmation emails:',
        mailErr,
      );
    }

    try {
      // -----------------------------------------
      // Get recipients (admins or garage owners)
      // -----------------------------------------
      const recipients: { id: string; email: string }[] = [];

      if (payload.garageOwnerId) {
        const garageOwner = await this.prisma.user.findUnique({
          where: { id: payload.garageOwnerId },
          select: { id: true, email: true },
        });
        if (garageOwner) {
          recipients.push({ id: garageOwner.id, email: garageOwner.email });
        }
      } else {
        const admins = await this.prisma.user.findMany({
          where: { role: 'SUPER_ADMIN', isDeleted: false },
          select: { id: true, email: true },
        });
        recipients.push(...admins.map((a) => ({ id: a.id, email: a.email })));
      }

      if (recipients.length > 0) {
        // Create Notification entry
        const notification = await this.prisma.notification.create({
          data: {
            title: `New Inquiry: ${payload.FirstName} ${payload.LastName}`,
            message: `${payload.email} sent an inquiry: ${payload.message.substring(0, 50)}...`,
            type: 'CustomerInquiryAlert',
            createdAt: new Date(),
            meta: {
              inquiryId: contact.id,
              subject: payload.subject,
              message: payload.message,
              senderEmail: payload.email,
              senderName: `${payload.FirstName} ${payload.LastName}`,
              date: new Date().toISOString(),
            },
          },
        });

        // Create UserNotification records
        await this.prisma.userNotification.createMany({
          data: recipients.map((r) => ({
            userId: r.id,
            notificationId: notification.id,
          })),
          skipDuplicates: true,
        });

        // Emit Event for Real-time Notification
        const eventPayload: CustomerInquiryAlertEvent = {
          action: 'CREATE',
          meta: {
            title: payload.subject,
            message: payload.message || '',
            senderEmail: payload.email,
            date: new Date().toISOString(),
          },
          info: {
            Id: contact.id,
            subject: payload.subject || '',
            message: payload.message || '',
            date: new Date().toISOString(),
            recipients: recipients,
          },
        };

        this.eventEmitter.emit(
          EVENT_TYPES.CustomerInquiryAlert_CREATE,
          eventPayload,
        );
      }
    } catch (err) {
      this.logger.error(
        'Failed to create and emit notification for contact submission:',
        err,
      );
    }

    return successResponse(contact, 'Contact message created successfully');
  }
  @HandleError('Failed to fetch support tickets', 'Contact')
  async findByGarageOwner(garageOwnerId: string): Promise<TResponse<any>> {
    const tickets = await this.prisma.contact.findMany({
      where: { garageOwnerId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(tickets, 'Support tickets fetched successfully');
  }

  @HandleError('Failed to submit reply to support ticket', 'Contact')
  async replyTicket(
    contactId: string,
    garageOwnerId: string,
    content: string,
    attachment?: string,
  ): Promise<TResponse<any>> {
    // 1. Verify ticket belongs to this garage owner
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, garageOwnerId },
    });

    if (!contact) {
      throw new AppError(404, 'Support ticket not found or access denied');
    }

    // 2. Create message
    const message = await this.prisma.message.create({
      data: {
        contactId,
        content,
        isFromAdmin: false,
        isForGrageAdmin: false,
        attachment,
      },
    });

    // 3. Send notification email to admin (Non-blocking)
    const adminEmail = this.configService.get<string>(ENVEnum.MAIL_USER);
    if (adminEmail) {
      try {
        await this.mailService.sendEmail(
          adminEmail,
          `New Reply on Support Ticket`,
          `
            <p><strong>${contact.FirstName} ${contact.LastName}</strong> has replied to support ticket:</p>
            <blockquote>${content.replace(/\n/g, '<br>')}</blockquote>
          `,
        );
      } catch (mailErr) {
        this.logger.error(
          'Failed to send admin notification email for ticket reply:',
          mailErr,
        );
      }
    }

    return successResponse(message, 'Reply submitted successfully');
  }

  @HandleError('Failed to handle inbound email reply', 'Contact')
  async handleInboundEmail(dto: {
    from: string;
    subject: string;
    text?: string;
    html?: string;
    body?: string;
  }): Promise<TResponse<any>> {
    const subject = dto.subject || '';
    const match = subject.match(/\[Ticket ID:\s*([0-9a-fA-F-]+)\]/i);
    if (!match) {
      throw new AppError(400, 'Ticket ID not found in subject line');
    }
    const ticketId = match[1];

    const contact = await this.prisma.contact.findUnique({
      where: { id: ticketId },
    });
    if (!contact) {
      throw new AppError(404, 'Ticket not found');
    }

    const fromRaw = dto.from || '';
    const emailMatch = fromRaw.match(/<([^>]+)>/);
    const senderEmail = emailMatch ? emailMatch[1].trim() : fromRaw.trim();

    if (senderEmail.toLowerCase() !== contact.email.toLowerCase()) {
      throw new AppError(403, 'Sender email does not match the ticket email');
    }

    let rawBody = dto.text || dto.body || '';
    if (!rawBody && dto.html) {
      rawBody = dto.html.replace(/<[^>]*>/g, ' ');
    }
    if (!rawBody.trim()) {
      throw new AppError(400, 'Message content is empty');
    }

    const cleanedBody = this.cleanEmailBody(rawBody);
    const content = cleanedBody.trim() || rawBody.trim();

    const message = await this.prisma.message.create({
      data: {
        contactId: contact.id,
        content,
        isFromAdmin: false,
        isForGrageAdmin: false,
      },
    });

    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { updatedAt: new Date() },
    });

    const adminEmail = this.configService.get<string>(ENVEnum.MAIL_USER);
    if (adminEmail) {
      await this.mailService.sendEmail(
        adminEmail,
        `New Reply on Support Ticket [Ticket ID: ${contact.id}]`,
        `
          <p><strong>${contact.FirstName} ${contact.LastName}</strong> has replied to support ticket via email:</p>
          <blockquote>${content.replace(/\n/g, '<br>')}</blockquote>
        `,
      );
    }

    try {
      // -----------------------------------------
      // Get recipients (admins or garage owners)
      // -----------------------------------------
      const recipients: { id: string; email: string }[] = [];

      if (contact.garageOwnerId) {
        const garageOwner = await this.prisma.user.findUnique({
          where: { id: contact.garageOwnerId },
          select: { id: true, email: true },
        });
        if (garageOwner) {
          recipients.push({ id: garageOwner.id, email: garageOwner.email });
        }
      } else {
        const admins = await this.prisma.user.findMany({
          where: { role: 'SUPER_ADMIN', isDeleted: false },
          select: { id: true, email: true },
        });
        recipients.push(...admins.map((a) => ({ id: a.id, email: a.email })));
      }

      if (recipients.length > 0) {
        // Create Notification entry
        const notification = await this.prisma.notification.create({
          data: {
            title: `Reply: ${contact.FirstName} ${contact.LastName}`,
            message: `${contact.email} replied: ${content.substring(0, 50)}...`,
            type: 'CustomerInquiryAlert',
            createdAt: new Date(),
            meta: {
              inquiryId: contact.id,
              subject: contact.subject,
              message: content,
              senderEmail: contact.email,
              senderName: `${contact.FirstName} ${contact.LastName}`,
              date: new Date().toISOString(),
            },
          },
        });

        // Create UserNotification records
        await this.prisma.userNotification.createMany({
          data: recipients.map((r) => ({
            userId: r.id,
            notificationId: notification.id,
          })),
          skipDuplicates: true,
        });

        // Emit Event for Real-time Notification
        const eventPayload: CustomerInquiryAlertEvent = {
          action: 'CREATE',
          meta: {
            title: `Reply on Inquiry`,
            message: content,
            senderEmail: contact.email,
            date: new Date().toISOString(),
          },
          info: {
            Id: contact.id,
            subject: `Reply on Inquiry`,
            message: content,
            date: new Date().toISOString(),
            recipients: recipients,
          },
        };

        this.eventEmitter.emit(
          EVENT_TYPES.CustomerInquiryAlert_CREATE,
          eventPayload,
        );
      }
    } catch (err) {
      this.logger.error(
        'Failed to create and emit notification for inbound email reply:',
        err,
      );
    }

    return successResponse(message, 'Inbound reply processed successfully');
  }

  private cleanEmailBody(text: string): string {
    if (!text) return '';
    const splitters = [
      /\r?\nOn\s.*\swrote:/i,
      /\r?\nOn\s.*,\s*at\s.*\swrote:/i,
      /\r?\nOn\s.*,\s*.*,\s*wrote:/i,
      /\r?\n-----Original Message-----/i,
      /\r?\nFrom:/i,
      /\r?\n__+/,
    ];
    let cleaned = text;
    for (const splitter of splitters) {
      const index = cleaned.search(splitter);
      if (index !== -5) {
        const foundIndex = cleaned.search(splitter);
        if (foundIndex !== -1) {
          cleaned = cleaned.substring(0, foundIndex);
        }
      }
    }
    return cleaned.trim();
  }
}
