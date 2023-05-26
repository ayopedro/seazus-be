import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { User } from '@prisma/client';

@Injectable()
export class MailerService {
  constructor(private mailerService: NestMailerService) {}

  async sendConfirmEmailMessage(
    { firstName, lastName, email }: User,
    token: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirm your email address',
      //   html: '<h1>Hello World</h1>',
      template: 'confirmEmail',
      context: {
        firstName,
        lastName,
        token,
      },
    });
    return { message: 'Confimation email sent!' };
  }
}
