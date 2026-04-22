import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  findAll() {
    return this.productRepository.find({
      relations: ['category'],
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['category'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto) {
    const product = this.productRepository.create({
      ...dto,
      price: parseFloat(dto.price),
    });
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = parseFloat(dto.price);
    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId;
      product.category = { id: dto.categoryId } as any;
    }
    if (dto.order !== undefined) product.order = dto.order;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    return this.productRepository.save(product);
  }

  async updateImage(id: string, imageUrl: string) {
    const product = await this.findOne(id);
    product.imageUrl = imageUrl;
    return this.productRepository.save(product);
  }

  async reorder(items: { id: string; order: number }[]) {
    await Promise.all(
      items.map(({ id, order }) => this.productRepository.update(id, { order })),
    );
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
