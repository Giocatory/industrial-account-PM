import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.yandex.ru'),
      port: config.get<number>('SMTP_PORT', 465),
      secure: true,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: email,
        subject: 'Подтверждение email — Личный кабинет',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Подтверждение email</h2>
            <p>Ваш одноразовый код подтверждения:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                        text-align: center; padding: 20px; background: #f5f5f5; 
                        border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>Код действителен 15 минут.</p>
            <p style="color: #888; font-size: 12px;">Если вы не регистрировались — проигнорируйте это письмо.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${email}`, err);
    }
  }

  async sendPasswordReset(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: email,
        subject: 'Сброс пароля — Личный кабинет',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Сброс пароля</h2>
            <p>Ваш код для сброса пароля:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                        text-align: center; padding: 20px; background: #f5f5f5; 
                        border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>Код действителен 15 минут.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send password reset to ${email}`, err);
    }
  }

  async sendAccountApproved(email: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: email,
        subject: 'Аккаунт подтверждён — Личный кабинет',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Аккаунт подтверждён</h2>
            <p>Ваш аккаунт в Личном кабинете управления проектами был подтверждён администратором.</p>
            <p>Теперь вы можете войти в систему.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send approval email to ${email}`, err);
    }
  }
}
