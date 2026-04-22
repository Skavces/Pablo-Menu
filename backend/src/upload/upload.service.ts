import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: configService.getOrThrow<string>('minio.endpoint'),
      port: configService.get<number>('minio.port') ?? 9000,
      useSSL: false,
      accessKey: configService.getOrThrow<string>('minio.accessKey'),
      secretKey: configService.getOrThrow<string>('minio.secretKey'),
    });
    this.bucket = configService.getOrThrow<string>('minio.bucket');
    this.publicUrl = configService.getOrThrow<string>('minio.publicUrl');
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        await this.client.setBucketPolicy(this.bucket, JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          }],
        }));
      }
    } catch (err) {
      this.logger.error('MinIO init failed', err);
    }
  }

  async uploadProductImage(productId: string, file: Express.Multer.File): Promise<string> {
    const processedBuffer = await sharp(file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const objectName = `products/${productId}/${uuidv4()}.webp`;

    await this.client.putObject(this.bucket, objectName, processedBuffer, processedBuffer.length, {
      'Content-Type': 'image/webp',
    });

    return `${this.publicUrl}/${this.bucket}/${objectName}`;
  }

  async deleteObject(objectName: string) {
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch (err) {
      this.logger.warn(`Failed to delete object ${objectName}`, err);
    }
  }
}
