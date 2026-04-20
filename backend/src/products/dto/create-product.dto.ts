import { IsString, IsBoolean, IsInt, IsOptional, IsUUID, IsNumberString, MinLength, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumberString()
  price: string;

  @IsUUID()
  categoryId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
