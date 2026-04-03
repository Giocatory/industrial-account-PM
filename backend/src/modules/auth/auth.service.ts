import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

const MAX_LOGIN_ATTEMPTS = 3;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    const hashed = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = this.usersRepo.create({
      ...dto,
      password: hashed,
      otpCode: otp,
      otpExpiresAt,
      status: UserStatus.PENDING,
    });

    await this.usersRepo.save(user);
    await this.mailService.sendOtp(user.email, otp);

    return { message: 'Регистрация успешна. Проверьте email для подтверждения.' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Пользователь не найден');
    if (user.emailVerified) throw new BadRequestException('Email уже подтверждён');
    if (user.otpCode !== dto.code) throw new BadRequestException('Неверный код');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) throw new BadRequestException('Код истёк');

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.usersRepo.save(user);

    return { message: 'Email подтверждён. Ожидайте подтверждения администратора.' };
  }

  async login(
    dto: LoginDto,
    res: any,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user) throw new UnauthorizedException('Неверный email или пароль');

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Аккаунт заблокирован. Попробуйте через ${mins} мин.`);
    }

    const passOk = await bcrypt.compare(dto.password, user.password);
    if (!passOk) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await this.usersRepo.save(user);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.emailVerified)
      throw new ForbiddenException('Email не подтверждён');
    if (user.status === UserStatus.PENDING)
      throw new ForbiddenException('Аккаунт ожидает подтверждения администратора');
    if (user.status === UserStatus.REJECTED)
      throw new ForbiddenException('Аккаунт отклонён');
    if (user.status === UserStatus.BLOCKED)
      throw new ForbiddenException('Аккаунт заблокирован');

    // Reset failed attempts
    user.loginAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepo.save(user);

    const tokens = await this.generateTokens(user);

    // Set httpOnly refresh cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password, otpCode, otpExpiresAt, loginAttempts, lockedUntil, ...safeUser } = user;

    return { accessToken: tokens.accessToken, user: safeUser };
  }

  async refresh(refreshToken: string, res: any): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new Error();

      const tokens = await this.generateTokens(user);
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken: tokens.accessToken };
    } catch {
      throw new UnauthorizedException('Сессия истекла');
    }
  }

  async logout(res: any): Promise<{ message: string }> {
    res.clearCookie('refreshToken');
    return { message: 'Выход выполнен' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'Если email зарегистрирован, вы получите письмо.' };
    }

    const otp = this.generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersRepo.save(user);
    await this.mailService.sendPasswordReset(user.email, otp);

    return { message: 'Если email зарегистрирован, вы получите письмо.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || user.otpCode !== dto.code || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Неверный или истёкший код');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.usersRepo.save(user);

    return { message: 'Пароль успешно изменён' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
