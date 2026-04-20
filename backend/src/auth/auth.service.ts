import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';
import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';
import { AdminUser } from './admin-user.entity';
import { LoginDto } from './dto/login.dto';
import { VerifyTotpLoginDto } from './dto/verify-totp-login.dto';
import { TotpCodeDto } from './dto/totp-code.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const email = this.configService.get<string>('admin.email');
    const password = this.configService.get<string>('admin.password');

    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed');
      return;
    }

    const existing = await this.adminUserRepository.findOne({ where: { email } });
    if (!existing) {
      const hash = await bcrypt.hash(password, 12);
      await this.adminUserRepository.save({ email, passwordHash: hash });
      this.logger.log(`Admin user created: ${email}`);
    } else {
      const same = await bcrypt.compare(password, existing.passwordHash);
      if (!same) {
        existing.passwordHash = await bcrypt.hash(password, 12);
        await this.adminUserRepository.save(existing);
        this.logger.log(`Admin password updated: ${email}`);
      }
    }
  }

  // ─── Encryption (AES-256-GCM) ─────────────────────────────────────────────

  private getEncryptionKey(): Buffer {
    const hex = this.configService.get<string>('totp.encryptionKey');
    if (!hex || hex.length !== 64) {
      throw new Error('TOTP_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
  }

  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(ciphertext: string): string {
    const key = this.getEncryptionKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid ciphertext format');
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return (
      decipher.update(Buffer.from(encryptedHex, 'hex')).toString('utf8') +
      decipher.final('utf8')
    );
  }

  // ─── TOTP helpers ─────────────────────────────────────────────────────────

  private isTotpCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  private isBackupCode(code: string): boolean {
    return /^[A-F0-9]{5}-[A-F0-9]{5}$/i.test(code);
  }

  private checkTotpCode(user: AdminUser, token: string): boolean {
    if (!user.totpSecret) return false;

    const secret = this.decrypt(user.totpSecret);
    const valid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) return false;

    // Replay protection: reject if this exact token was the last accepted one
    if (user.totpLastUsedToken) {
      const a = Buffer.from(token.padEnd(10, '\0'));
      const b = Buffer.from(user.totpLastUsedToken.padEnd(10, '\0'));
      if (timingSafeEqual(a, b)) return false;
    }

    return true;
  }

  private async checkBackupCode(user: AdminUser, code: string): Promise<boolean> {
    if (!user.totpBackupCodes?.length) return false;

    const normalized = code.toUpperCase();
    for (let i = 0; i < user.totpBackupCodes.length; i++) {
      const match = await bcrypt.compare(normalized, user.totpBackupCodes[i]);
      if (match) {
        user.totpBackupCodes = user.totpBackupCodes.filter((_, idx) => idx !== i);
        await this.adminUserRepository.save(user);
        return true;
      }
    }
    return false;
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.adminUserRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      await bcrypt.hash(dto.password, 12); // timing attack mitigation
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    if (user.totpEnabled) {
      const preAuthToken = this.jwtService.sign(
        { sub: user.id, type: 'pre-auth' },
        { expiresIn: '5m' },
      );
      return { requiresTotp: true as const, preAuthToken };
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: 'admin',
      type: 'auth',
    });
    return { accessToken };
  }

  async verifyTotpLogin(dto: VerifyTotpLoginDto) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(dto.preAuthToken);
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum');
    }

    if (payload.type !== 'pre-auth') {
      throw new UnauthorizedException('Geçersiz token türü');
    }

    const user = await this.adminUserRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.totpEnabled) {
      throw new UnauthorizedException('Geçersiz kullanıcı');
    }

    if (this.isTotpCode(dto.code)) {
      if (!this.checkTotpCode(user, dto.code)) {
        throw new UnauthorizedException('Geçersiz veya daha önce kullanılmış kod');
      }
      user.totpLastUsedToken = dto.code;
      await this.adminUserRepository.save(user);
    } else if (this.isBackupCode(dto.code)) {
      if (!(await this.checkBackupCode(user, dto.code))) {
        throw new UnauthorizedException('Geçersiz yedek kod');
      }
    } else {
      throw new UnauthorizedException('Geçersiz kod formatı');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: 'admin',
      type: 'auth',
    });
    return { accessToken };
  }

  // ─── TOTP Setup ───────────────────────────────────────────────────────────

  async getTotpStatus(userId: string) {
    const user = await this.adminUserRepository.findOneOrFail({ where: { id: userId } });
    return {
      enabled: user.totpEnabled,
      backupCodesRemaining: user.totpBackupCodes?.length ?? 0,
    };
  }

  async generateTotpSetup(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.adminUserRepository.findOneOrFail({ where: { id: userId } });

    const generated = speakeasy.generateSecret({
      length: 20,
      name: `Pablo Artisan:${user.email}`,
      issuer: 'Pablo Artisan',
    });
    const secret = generated.base32;
    const otpauth = generated.otpauth_url!;
    const qrCode = await toDataURL(otpauth, { errorCorrectionLevel: 'H', width: 256 });

    user.totpSecretPending = this.encrypt(secret);
    await this.adminUserRepository.save(user);

    return { qrCode, secret };
  }

  async enableTotp(userId: string, dto: TotpCodeDto): Promise<{ backupCodes: string[] }> {
    if (!this.isTotpCode(dto.code)) {
      throw new BadRequestException('Etkinleştirme için 6 haneli kod gereklidir');
    }

    const user = await this.adminUserRepository.findOneOrFail({ where: { id: userId } });

    if (!user.totpSecretPending) {
      throw new BadRequestException('Önce kurulumu başlatın');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('2FA zaten aktif');
    }

    const secret = this.decrypt(user.totpSecretPending);
    const valid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: dto.code,
      window: 1,
    });
    if (!valid) {
      throw new UnauthorizedException('Geçersiz kod — authenticator uygulamasındaki kodu girin');
    }

    const plainCodes = Array.from({ length: 8 }, () => {
      const b = randomBytes(5).toString('hex').toUpperCase();
      return `${b.slice(0, 5)}-${b.slice(5)}`;
    });
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));

    user.totpSecret = this.encrypt(secret);
    user.totpSecretPending = null;
    user.totpEnabled = true;
    user.totpLastUsedToken = null;
    user.totpBackupCodes = hashedCodes;
    await this.adminUserRepository.save(user);

    return { backupCodes: plainCodes };
  }

  async disableTotp(userId: string, dto: TotpCodeDto): Promise<void> {
    const user = await this.adminUserRepository.findOneOrFail({ where: { id: userId } });

    if (!user.totpEnabled) {
      throw new BadRequestException('2FA zaten devre dışı');
    }

    let valid = false;
    if (this.isTotpCode(dto.code)) {
      valid = this.checkTotpCode(user, dto.code);
    } else if (this.isBackupCode(dto.code)) {
      valid = await this.checkBackupCode(user, dto.code);
    }

    if (!valid) {
      throw new UnauthorizedException('Geçersiz kod');
    }

    user.totpEnabled = false;
    user.totpSecret = null;
    user.totpSecretPending = null;
    user.totpLastUsedToken = null;
    user.totpBackupCodes = null;
    await this.adminUserRepository.save(user);
  }
}
