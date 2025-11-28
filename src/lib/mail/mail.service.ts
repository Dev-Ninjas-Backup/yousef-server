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

  // Universal payment confirmation email
  async sendPaymentConfirmationEmail(
    email: string,
    data: {
      userName: string;
      paymentType:
        | 'promotional'
        | 'pay_per_product'
        | 'product_monthly'
        | 'garage_monthly';
      amount: number;
      transactionId: string;
      productName?: string;
      garageName?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<nodemailer.SentMessageInfo> {
    const config = {
      promotional: {
        emoji: '🎉',
        title: 'Payment Successful!',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        message: 'Your promotional payment has been successfully processed.',
      },
      pay_per_product: {
        emoji: '✅',
        title: 'Payment Confirmed!',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        message: 'Your product listing credit has been added to your account.',
      },
      product_monthly: {
        emoji: '🎊',
        title: 'Subscription Activated!',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        message:
          'Your Product Monthly Subscription has been successfully activated.',
      },
      garage_monthly: {
        emoji: '🏆',
        title: 'Garage Subscription Activated!',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        message: `Your Garage Monthly Subscription has been successfully activated.${data.garageName ? ` <strong>${data.garageName}</strong> is now premium!` : ''}`,
      },
    }[data.paymentType];

    const content = `
      <div style="background: ${config.gradient}; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: white; margin: 0; font-size: 28px;">${config.emoji} ${config.title}</h2>
      </div>
      
      <p style="font-size: 16px; color: #333;">Hi <strong>${data.userName}</strong>,</p>
      <p style="font-size: 15px; color: #555; line-height: 1.6;">${config.message}</p>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">📋 Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${data.productName ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Product:</strong></td><td style="padding: 8px 0; color: #333; text-align: right;">${data.productName}</td></tr>` : ''}
          ${data.garageName ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Garage:</strong></td><td style="padding: 8px 0; color: #333; text-align: right;">${data.garageName}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td><td style="padding: 8px 0; color: #28a745; font-weight: bold; text-align: right;">$${(data.amount / 100).toFixed(2)} USD</td></tr>
          ${data.startDate ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Start Date:</strong></td><td style="padding: 8px 0; color: #333; text-align: right;">${new Date(data.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>` : ''}
          ${data.endDate ? `<tr><td style="padding: 8px 0; color: #666;"><strong>End Date:</strong></td><td style="padding: 8px 0; color: #333; text-align: right;">${new Date(data.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666;"><strong>Transaction ID:</strong></td><td style="padding: 8px 0; color: #666; text-align: right; font-family: monospace; font-size: 12px;">${data.transactionId}</td></tr>
        </table>
      </div>

      <p style="font-size: 15px; color: #333; margin-top: 20px;">Best regards,<br/><strong>SAYARA HUB Team</strong></p>
    `;

    const subjects = {
      promotional: '🎉 Payment Confirmed - Product Promoted!',
      pay_per_product: '✅ Payment Confirmed - Credit Added!',
      product_monthly: '🎊 Product Subscription Activated!',
      garage_monthly: '🏆 Garage Subscription Activated!',
    };

    const mailOptions = {
      from: `"SAYARA HUB" <${this.configService.get<string>(ENVEnum.MAIL_USER)}>`,
      to: email,
      subject: subjects[data.paymentType],
      html: this.getEmailTemplate(content),
    };

    return this.transporter.sendMail(mailOptions);
  }
}
