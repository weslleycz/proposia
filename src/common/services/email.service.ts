import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
    attachments?: { filename: string; content: Buffer; contentType: string }[],
  ): Promise<void> {
    await this.transporter.sendMail({
      from: '"No-Reply" <no-reply@mailhog.local>',
      to,
      subject,
      text,
      html,
      attachments,
    });
  }
}
