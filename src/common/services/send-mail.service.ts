import { Global, Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as pug from 'pug';
import { EmailService } from './email.service';

dotenv.config();

interface SendMailData {
  to: string;
  subject: string;
  template: string;
  parametros?: Record<string, any>; 
}

@Global()
@Injectable()
export class SendMailService {
  constructor(private readonly emailService: EmailService) {}

  async send(data: SendMailData): Promise<void> {
    const pugFilePath = `${process.cwd()}/src/common/templates/${data.template}`;

    const pugFileContent = await this.readFileAsync(pugFilePath);
    const html = pug.render(pugFileContent, { ...data.parametros });

    await this.emailService.sendMail(
      data.to,
      data.subject,
      '',
      html,
    );
  }

  private readFileAsync(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
