import { IsString, IsBoolean, IsInt, IsOptional, IsUUID, IsNumberString, MinLength, MaxLength, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumberString()
  @IsOptional()
  price?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
