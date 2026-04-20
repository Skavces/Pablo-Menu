export const configuration = () => ({
  port: parseInt(process.env.BACKEND_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'pablo',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'pablo_menu',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  totp: {
    encryptionKey: process.env.TOTP_ENCRYPTION_KEY || '',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'pablo-menu',
    publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  },
});
