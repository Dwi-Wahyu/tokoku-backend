import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { promises as fs } from 'fs'; // Untuk operasi file system
import { join } from 'path';
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

  async create(createProductDto: CreateProductDto, imagePath?: string) {
    const product = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...createProductDto,
          image: imagePath,
          sku: '',
        },
      });

      const sku = this.generateSku(
        newProduct.name,
        newProduct.category,
        newProduct.id,
      );

      const updatedProduct = await tx.product.update({
        where: { id: newProduct.id },
        data: { sku },
      });

      return updatedProduct;
    });

    return product;
  }

  findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    imagePath?: string,
  ) {
    const productToUpdate = await this.findOne(id);

    // Jika ada gambar baru, hapus gambar lama
    if (imagePath && productToUpdate.image) {
      try {
        await fs.unlink(join(process.cwd(), productToUpdate.image));
      } catch (error) {
        console.error(
          `Failed to delete old image: ${productToUpdate.image}`,
          error,
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        image: imagePath || productToUpdate.image, // Gunakan gambar baru, atau pertahankan yg lama
      },
    });
  }

  async remove(id: number) {
    const productToDelete = await this.findOne(id);

    // Hapus gambar terkait jika ada
    if (productToDelete.image) {
      try {
        await fs.unlink(join(process.cwd(), productToDelete.image));
      } catch (error) {
        console.error(
          `Failed to delete image: ${productToDelete.image}`,
          error,
        );
      }
    }

    // Hapus produk dari database
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
