import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'totp_enabled', default: false })
  totpEnabled: boolean;

  // AES-256-GCM encrypted: "iv:authTag:ciphertext" (all hex)
  @Column({ name: 'totp_secret', nullable: true, type: 'varchar' })
  totpSecret: string | null;

  // Pending secret during setup, cleared after enable
  @Column({ name: 'totp_secret_pending', nullable: true, type: 'varchar' })
  totpSecretPending: string | null;

  // Last successfully verified token — replay protection
  @Column({ name: 'totp_last_used_token', nullable: true, type: 'varchar', length: 10 })
  totpLastUsedToken: string | null;

  // bcrypt-hashed single-use backup codes
  @Column({ name: 'totp_backup_codes', nullable: true, type: 'json' })
  totpBackupCodes: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
