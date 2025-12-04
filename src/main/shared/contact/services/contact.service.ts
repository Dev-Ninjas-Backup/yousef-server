import { Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

import { ConfigService } from '@nestjs/config';
import { ContactEmailTemplate } from 'src/common/email/contact';
import { ENVEnum } from 'src/common/enum/env.enum';
import { CreateContactDto } from '../dto/create-subscribe.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

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
}
