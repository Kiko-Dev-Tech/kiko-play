import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760950000000 implements MigrationInterface {
  name = 'InitialSchema1760950000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "board" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "categories" jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "game" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(8) NOT NULL,
        "status" varchar(16) NOT NULL,
        "boardId" uuid,
        "board" jsonb NOT NULL,
        "players" jsonb NOT NULL DEFAULT '[]',
        "playedQuestions" jsonb NOT NULL DEFAULT '[]',
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "endedAt" timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_game_code" ON "game" ("code")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game"`);
    await queryRunner.query(`DROP TABLE "board"`);
  }
}
