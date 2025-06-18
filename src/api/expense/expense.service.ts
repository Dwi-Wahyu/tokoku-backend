import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseCategory, StockMovementType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const { processedById, category, stockItems, ...expenseData } =
      createExpenseDto;

    // Jika kategori adalah STOCK_PURCHASE, jalankan logika khusus
    if (category === ExpenseCategory.STOCK_PURCHASE) {
      if (!stockItems || stockItems.length === 0) {
        throw new BadRequestException(
          'Stock items must be provided for a stock purchase.',
        );
      }
      return this.createStockPurchaseExpense(createExpenseDto);
    }

    // Jika kategori lain, buat expense biasa
    return this.prisma.expense.create({
      data: {
        ...expenseData,
        category,
        processedBy: {
          connect: { id: processedById },
        },
      },
    });
  }

  private async createStockPurchaseExpense(dto: CreateExpenseDto) {
    const { processedById, stockItems, ...expenseData } = dto;

    // Gunakan transaksi untuk memastikan semua operasi berhasil atau gagal bersamaan
    return this.prisma.$transaction(async (tx) => {
      // 1. Buat record Expense utama
      const expense = await tx.expense.create({
        data: {
          ...expenseData,
          processedBy: {
            connect: { id: processedById },
          },
        },
      });

      // 2. Loop melalui setiap item stok yang dibeli
      for (const item of stockItems) {
        // 2a. Buat record StockMovement
        await tx.stockMovement.create({
          data: {
            type: StockMovementType.PURCHASE,
            quantityChange: item.quantity, // Positif karena stok masuk
            notes: `Purchase via expense ID: ${expense.id}`,
            product: {
              connect: { id: item.productId },
            },
            expense: {
              connect: { id: expense.id },
            },
          },
        });

        // 2b. Update jumlah stok di produk terkait
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
            // Opsional: Update harga modal (cost) produk dengan harga beli terbaru
            cost: item.cost,
          },
        });
      }

      return expense;
    });
  }

  findAll() {
    return this.prisma.expense.findMany({
      include: {
        processedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        processedBy: true,
        stockMovements: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  // Peringatan: Mengubah atau menghapus expense yang terkait dengan stok
  // bisa menyebabkan inkonsistensi data jika tidak ditangani dengan hati-hati.
  // Untuk saat ini, kita hanya berikan fungsi hapus sederhana.
  async remove(id: number) {
    const expense = await this.findOne(id);

    if (expense.category === ExpenseCategory.STOCK_PURCHASE) {
      throw new BadRequestException(
        'Cannot delete a stock purchase expense directly. This action requires reversing stock movements and should be handled with a separate process.',
      );
    }

    return this.prisma.expense.delete({ where: { id } });
  }
}
