import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsDateString,
  IsArray,
  IsInt,
} from 'class-validator';
import { DiscountType } from '@prisma/client'; // Import enum dari Prisma Client

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType; // Validasi harus berupa 'PERCENTAGE' atau 'FIXED_AMOUNT'

  @IsNumber()
  @Min(0)
  value: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  // Array berisi ID dari produk yang ingin dihubungkan dengan diskon ini
  @IsArray()
  @IsInt({ each: true }) // Memastikan setiap elemen dalam array adalah integer
  @IsOptional()
  productIds?: number[];
}
