import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';
import { ENVEnum } from 'src/common/enum/env.enum';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user: this.configService.get<string>(ENVEnum.MAIL_USER),
        pass: this.configService.get<string>(ENVEnum.MAIL_PASS),
      },
    });
  }

  private getEmailTemplate(content: string): string {
    const logoUrl =
      this.configService.get<string>(ENVEnum.MAIL_LOGO_URL) ||
      'https://your-default-logo-url.com/logo.png';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
          <img src="${logoUrl}" alt="SAYARA HUB Logo" style="max-width: 200px; height: auto;" />
        </div>
        <div style="padding: 20px;">
          ${content}
        </div>
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #6c757d;">
          <p>&copy; ${new Date().getFullYear()} SAYARA HUB. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  async sendLoginCodeEmail(
    email: string,
    code: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const content = `
      <h3>Welcome!</h3>
      <p>Please login by using the code below:</p>
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #6c757d; font-size: 14px;">This code will expire in 10 minutes.</p>
    `;

    const mailOptions = {
      from: `"SAYARA HUB" <${this.configService.get<string>(ENVEnum.MAIL_USER)}>`,
      to: email,
      subject: 'Login Code',
      html: this.getEmailTemplate(content),
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const mailOptions = {
      from: `"SAYARA HUB" <${this.configService.get<string>(ENVEnum.MAIL_USER)}>`,
      to: email,
      subject,
      html: this.getEmailTemplate(message),
    };

    return this.transporter.sendMail(mailOptions);
  }
}
