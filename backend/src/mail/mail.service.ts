import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: any[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private loadTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'mail',
        'templates',
        `${templateName}.hbs`,
      );

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);

      return compiledTemplate(context);
    } catch (error) {
      this.logger.error(
        `Failed to load email template: ${templateName}`,
        error,
      );
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  async sendMail(options: MailOptions): Promise<void> {
    try {
      const html = this.loadTemplate(options.template, options.context);

      await this.transporter.sendMail({
        from: {
          name: this.configService.get<string>(
            'EMAIL_FROM_NAME',
            'Your Company',
          ),
          address: this.configService.get<string>(
            'EMAIL_FROM_ADDRESS',
            'noreply@yourcompany.com',
          ),
        },
        to: options.to,
        subject: options.subject,
        html: html,
        attachments: options.attachments || [],
      });

      this.logger.log(
        `Email sent to ${options.to} with subject: ${options.subject}`,
      );
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new Error('Email could not be sent');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    otp: string,
    expirationMinutes: number,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset-otp',
      context: {
        name,
        otp,
        expirationMinutes,
      },
    });
  }

  async sendEmailVerificationEmail(
    email: string,
    name: string,
    otp: string,
    expirationMinutes: number,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'email-otp',
      context: {
        name,
        otp,
        expirationMinutes,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Welcome to Our Platform',
      template: 'welcome',
      context: {
        name,
      },
    });
  }
}
