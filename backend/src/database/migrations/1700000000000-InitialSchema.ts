import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id"                    UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "email"                 VARCHAR(255)      NOT NULL,
        "password_hash"         VARCHAR           NOT NULL,
        "totp_enabled"          BOOLEAN           NOT NULL DEFAULT false,
        "totp_secret"           VARCHAR                    DEFAULT NULL,
        "totp_secret_pending"   VARCHAR                    DEFAULT NULL,
        "totp_last_used_token"  VARCHAR(10)                DEFAULT NULL,
        "totp_backup_codes"     JSON                       DEFAULT NULL,
        "created_at"            TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR(100)  NOT NULL,
        "slug"        VARCHAR(120)  NOT NULL,
        "order"       INTEGER       NOT NULL DEFAULT 0,
        "is_active"   BOOLEAN       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"           UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "name"         VARCHAR(150)      NOT NULL,
        "description"  TEXT                       DEFAULT NULL,
        "price"        NUMERIC(10, 2)    NOT NULL,
        "image_url"    VARCHAR                    DEFAULT NULL,
        "is_active"    BOOLEAN           NOT NULL DEFAULT true,
        "order"        INTEGER           NOT NULL DEFAULT 0,
        "category_id"  UUID              NOT NULL,
        "created_at"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "admin_users"`);
  }
}
