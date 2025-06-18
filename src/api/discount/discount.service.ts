import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto) {
    const { productIds, ...discountData } = createDiscountDto;

    return this.prisma.discount.create({
      data: {
        ...discountData,
        // Hubungkan dengan produk jika productIds disediakan
        ...(productIds && {
          products: {
            connect: productIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        products: true, // Sertakan data produk dalam respons
      },
    });
  }

  findAll() {
    return this.prisma.discount.findMany({
      include: {
        products: {
          select: { id: true, name: true }, // Hanya ambil id dan nama produk
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return discount;
  }

  async update(id: number, updateDiscountDto: UpdateDiscountDto) {
    const { productIds, ...discountData } = updateDiscountDto;

    await this.findOne(id); // Memastikan diskon ada

    return this.prisma.discount.update({
      where: { id },
      data: {
        ...discountData,
        // Jika productIds disediakan, ganti semua produk yang terhubung dengan yang baru
        ...(productIds && {
          products: {
            set: productIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        products: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Memastikan diskon ada
    // Prisma secara otomatis akan menghapus relasi di tabel join
    return this.prisma.discount.delete({ where: { id } });
  }
}
