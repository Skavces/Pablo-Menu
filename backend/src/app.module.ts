import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { configuration } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { SeedModule } from './seed/seed.module';
import { HealthModule } from './health/health.module';
import { AdminUser } from './auth/admin-user.entity';
import { Category } from './categories/category.entity';
import { Product } from './products/product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [AdminUser, Category, Product],
        synchronize: config.get('nodeEnv') !== 'production',
        migrationsRun: config.get('nodeEnv') === 'production',
        migrations: [__dirname + '/database/migrations/*.{ts,js}'],
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 60 },
    ]),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    SeedModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
