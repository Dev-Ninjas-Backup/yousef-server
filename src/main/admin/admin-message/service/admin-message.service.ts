// src/main/shared/admin-message/service/admin-message.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

import { ContactEmailTemplate } from 'src/common/email/contact';
import { CreateAdminReplyDto } from '../dto/create-admin-message.dto';
import { PaginationDto } from 'src/common/dto/pagination';

@Injectable()
export class AdminMessageService {
  private readonly logger = new Logger(AdminMessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @HandleError('Failed to send admin reply', 'AdminMessage')
  async reply(
    dto: CreateAdminReplyDto,
    adminEmail: string,
  ): Promise<TResponse<any>> {
    // 1. Fetch contact
    const contact = await this.prisma.contact.findUnique({
      where: { id: dto.contactId },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        email: true,
      },
    });

    if (!contact) {
      throw new AppError(404, 'Contact not found');
    }

    // 2. Save admin reply
    const message = await this.prisma.message.create({
      data: {
        contactId: dto.contactId,
        isFromAdmin: true,
        content: dto.content,
      },
    });

    // 3. Send email to user
    await this.mailService.sendEmail(
      contact.email,
      'Support Team Reply',
      ContactEmailTemplate.adminReply({
        firstName: contact.FirstName,
        lastName: contact.LastName,
        content: dto.content,
      }),
    );

    // 4. Optional: Notify admin
    await this.mailService.sendEmail(
      adminEmail,
      `Reply sent to ${contact.email}`,
      `
        <p>You replied to <strong>${contact.FirstName} ${contact.LastName}</strong>:</p>
        <blockquote>${dto.content}</blockquote>
      `,
    );

    return successResponse(message, 'Reply sent successfully');
  }

  @HandleError('Failed to fetch contacts', 'Contact')
  async findAll(query: PaginationDto): Promise<TResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const contacts = await this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse(contacts, 'Contacts fetched successfully');
  }

  @HandleError('Failed to fetch contact', 'Contact')
  async findOne(id: string): Promise<TResponse<any>> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new AppError(404, `No contact found with ID: ${id}`);
    }

    return successResponse(contact, 'Contact fetched successfully');
  }

  @HandleError('Failed to delete contact', 'Contact')
  async remove(id: string): Promise<TResponse<any>> {
    await this.ensureExists(id);

    const deleted = await this.prisma.contact.delete({ where: { id } });

    return successResponse(deleted, 'Contact deleted successfully');
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.contact.findUnique({ where: { id } });
    if (!exists) {
      throw new AppError(404, `Contact with ID ${id} does not exist`);
    }
  }
}
