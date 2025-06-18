import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class StockItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  cost: number; // Harga beli per item saat itu
}
