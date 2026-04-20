import { IsString, Matches } from 'class-validator';

export class TotpCodeDto {
  @IsString()
  @Matches(/^(\d{6}|[A-F0-9]{5}-[A-F0-9]{5})$/i, { message: 'Geçersiz kod formatı' })
  code: string;
}
