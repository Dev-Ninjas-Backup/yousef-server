import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { PaginationDto } from 'src/common/dto/pagination';
import { CreateContactDto } from '../dto/create-subscribe.dto';
import { ENVEnum } from 'src/common/enum/env.enum';
import { ConfigService } from '@nestjs/config';
import { ContactEmailTemplate } from 'src/common/email/contact';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @HandleError('Failed to create contact message', 'Contact')
  async create(payload: CreateContactDto): Promise<TResponse<any>> {
    const contact = await this.prisma.contact.create({
      data: { ...payload },
    });

    const adminEmail = this.configService.get<string>(ENVEnum.MAIL_USER);

    if (!adminEmail) {
      this.logger.error('MAIL_USER not configured in environment');
      throw new AppError(400, 'Admin email not configured');
    }

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

    return successResponse(contact, 'Contact message created successfully');
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
