import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BullTypes, EmailTypes, NODEMAILER_TRANSPORTER } from '../config/types';
import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { Inject } from '@nestjs/common';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  attachments?: { filename: string, content: string, encoding: string }[];
}

@Processor(BullTypes.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(NODEMAILER_TRANSPORTER)
    private readonly transporter: nodemailer.Transporter,
  ) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;
    const emailData = data as EmailData;

    switch (name) {
      case EmailTypes.WELCOME: {
        console.log('Sending welcome email:', data);
        await this.transporter.sendMail({
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments,
        });
        break;
      }
      case EmailTypes.EMAIL_VERIFICATION: {
        console.log('Sending email verification email');
        break;
      }
      case EmailTypes.RESET_PASSWORD: {
        console.log('Sending reset password email');
        break;
      }
      default:
        console.log('Unknown email job');
        break;
    }
  }
}
