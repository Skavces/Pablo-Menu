import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class VerifyTotpLoginDto {
  @IsString()
  @IsNotEmpty()
  preAuthToken: string;

  // 6-digit TOTP  OR  XXXXX-XXXXX backup code
  @IsString()
  @Matches(/^(\d{6}|[A-F0-9]{5}-[A-F0-9]{5})$/i, { message: 'Geçersiz kod formatı' })
  code: string;
}
