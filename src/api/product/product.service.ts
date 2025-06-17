import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private generateSku(
    productName: string,
    category: string,
    productId: number,
  ): string {
    const categoryName = category || 'General';
    const categoryCode = categoryName.substring(0, 3).toUpperCase();
    const nameCode = productName
      .replace(/\s/g, '')
      .substring(0, 3)
      .toUpperCase();
    const paddedId = String(productId).padStart(4, '0');
    return `${categoryCode}-${nameCode}-${paddedId}`;
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...createProductDto, // DTO sudah berisi URL gambar jika ada
          sku: '',
        },
      });

      const sku = this.generateSku(
        newProduct.name,
        newProduct.category,
        newProduct.id,
      );

      return tx.product.update({
        where: { id: newProduct.id },
        data: { sku },
      });
    });

    return product;
  }

  findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Memastikan produk ada

    // TODO (Penting): Tambahkan logika untuk menghapus gambar lama dari Vercel Blob
    // jika field `image` di `updateProductDto` berisi URL baru.
    // Anda perlu URL gambar lama sebelum melakukan update.

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
      },
    });
  }

  async remove(id: number) {
    const productToDelete = await this.findOne(id); // Memastikan produk ada

    // TODO (Penting): Tambahkan logika untuk menghapus gambar produk dari Vercel Blob
    // menggunakan `productToDelete.image` (URL gambar).

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
