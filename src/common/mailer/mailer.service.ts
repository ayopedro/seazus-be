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

  async sendResetEmail({ firstName, email }: User, token: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset',
      //   html: '<h1>Hello World</h1>',
      template: 'resetPassword',
      context: {
        firstName,
        token,
      },
    });
    return { message: 'Password reset email sent!' };
  }

  async sendResetSuccessfulEmail({ firstName, email }: User) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Successful',
      //   html: '<h1>Hello World</h1>',
      template: 'passwordResetSuccess',
      context: {
        firstName,
      },
    });
    return { message: 'Password reset email sent!' };
  }
}
