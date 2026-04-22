import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  findAllPublic() {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['products'],
      order: { order: 'ASC', name: 'ASC' },
    }).then(cats => cats.map(c => ({
      ...c,
      products: c.products.filter(p => p.isActive).sort((a, b) => a.order - b.order),
    })));
  }

  findAll() {
    return this.categoryRepository.find({
      relations: ['products'],
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const cat = await this.categoryRepository.findOne({ where: { id }, relations: ['products'] });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already exists');
    const cat = this.categoryRepository.create(dto);
    return this.categoryRepository.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOne(id);
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.categoryRepository.findOne({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already exists');
    }
    Object.assign(cat, dto);
    return this.categoryRepository.save(cat);
  }

  async reorder(items: { id: string; order: number }[]) {
    await Promise.all(
      items.map(({ id, order }) => this.categoryRepository.update(id, { order })),
    );
  }

  async remove(id: string) {
    const cat = await this.findOne(id);
    await this.categoryRepository.remove(cat);
  }
}
