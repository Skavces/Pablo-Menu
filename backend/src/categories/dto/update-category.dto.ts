import { IsString, IsBoolean, IsInt, IsOptional, MinLength, MaxLength, Min, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  @IsOptional()
  slug?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
