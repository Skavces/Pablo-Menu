import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyTotpLoginDto } from './dto/verify-totp-login.dto';
import { TotpCodeDto } from './dto/totp-code.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('totp/verify-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyTotpLogin(@Body() dto: VerifyTotpLoginDto) {
    return this.authService.verifyTotpLogin(dto);
  }

  // ─── Authenticated TOTP management ───────────────────────────────────────

  @Get('totp/status')
  @UseGuards(JwtAuthGuard)
  getTotpStatus(@Req() req: AuthRequest) {
    return this.authService.getTotpStatus(req.user.id);
  }

  @Post('totp/generate')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  generateTotpSetup(@Req() req: AuthRequest) {
    return this.authService.generateTotpSetup(req.user.id);
  }

  @Post('totp/enable')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  enableTotp(@Req() req: AuthRequest, @Body() dto: TotpCodeDto) {
    return this.authService.enableTotp(req.user.id, dto);
  }

  @Post('totp/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  disableTotp(@Req() req: AuthRequest, @Body() dto: TotpCodeDto) {
    return this.authService.disableTotp(req.user.id, dto);
  }
}
