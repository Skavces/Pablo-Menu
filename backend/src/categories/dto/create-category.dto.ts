import { IsString, IsBoolean, IsInt, IsOptional, MinLength, MaxLength, Min, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
