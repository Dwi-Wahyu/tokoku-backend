import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import { StockItemDto } from './stock-item.dto';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  // ID dari user (kasir/admin) yang menginput pengeluaran ini
  @IsInt()
  processedById: number;

  // Opsional, hanya diisi jika kategori adalah STOCK_PURCHASE
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  @IsOptional()
  stockItems?: StockItemDto[];
}
