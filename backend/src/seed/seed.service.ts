import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';

const CATEGORIES = [
  { name: 'Sıcak Kahveler',  slug: 'sicak-kahveler',  order: 1 },
  { name: 'Soğuk Kahveler',  slug: 'soguk-kahveler',  order: 2 },
  { name: 'Frappeler',       slug: 'frappeler',        order: 3 },
  { name: 'Frozenlar',       slug: 'frozenlar',        order: 4 },
  { name: 'Sıcak İçecekler', slug: 'sicak-icecekler', order: 5 },
  { name: 'Buzlu İçecekler', slug: 'buzlu-icecekler', order: 6 },
  { name: 'Soğuk Çaylar',    slug: 'soguk-caylar',    order: 7 },
  { name: 'Tatlılar',        slug: 'tatlilar',         order: 8 },
  { name: 'Sandviçler',      slug: 'sandvicler',       order: 9 },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    for (const cat of CATEGORIES) {
      const exists = await this.categoryRepository.findOne({ where: { slug: cat.slug } });
      if (!exists) {
        await this.categoryRepository.save(this.categoryRepository.create(cat));
        this.logger.log(`Seeded category: ${cat.name}`);
      }
    }
  }
}
