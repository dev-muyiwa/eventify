import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BullTypes, EmailTypes, NODEMAILER_TRANSPORTER } from '../config/types';
import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { Inject } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { readFile } from 'node:fs';
import { promisify } from 'util';
import Handlebars from 'handlebars';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { JwtService } from '@nestjs/jwt';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  attachments?: { filename: string; content: string; encoding: string }[];
}

@Processor(BullTypes.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(NODEMAILER_TRANSPORTER)
    private readonly transporter: nodemailer.Transporter,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;
    const appName = this.configService.get<string>('app_name');
    const port = this.configService.get<number>('port') as number;
    const readFileAsync = promisify(readFile);

    try {
      switch (name) {
        case EmailTypes.WELCOME: {
          const { first_name, email } = data;
          const htmlPath = join('./src/util/emails/welcome-email.html');
          const html = await readFileAsync(htmlPath, 'utf8');
          const template = Handlebars.compile(html);
          const mail = template({
            first_name: first_name,
            active_events_url: `http://localhost:${port}/api/v1/events`,
          });

          await this.transporter.sendMail({
            to: email,
            subject: `Welcome to ${appName}`,
            html: mail,
          });
          break;
        }
        case EmailTypes.EMAIL_VERIFICATION: {
          const { first_name, last_name, email } = data;
          const token = this.jwtService.sign(
            { email: email, type: EmailTypes.EMAIL_VERIFICATION },
            { expiresIn: '1d' },
          );
          const encodedToken = Buffer.from(token).toString('base64');
          const htmlPath = join('./src/util/emails/confirmation-email.html');
          const html = await readFileAsync(htmlPath, 'utf8');
          const template = Handlebars.compile(html);
          const mail = template({
            first_name: first_name,
            last_name: last_name,
            confirmation_url: `http://localhost:${port}/api/v1/auth/verify-email?token=${encodedToken}`,
          });

          await this.transporter.sendMail({
            to: email,
            subject: `Verify your ${appName} account`,
            html: mail,
          });
          break;
        }
        case EmailTypes.RESET_PASSWORD: {
          console.log('Sending reset password email');
          break;
        }
        case EmailTypes.ACCOUNT_DEACTIVATION: {
          break;
        }
        case EmailTypes.ORDER_CONFIRMATION: {
          this.logger.info('Sending order confirmation email...');
          break;
        }
        default:
          console.log('Unknown email job');
          break;
      }
    } catch (err) {
      this.logger.error('Error processing email queue:', err);
    }
  }
}
