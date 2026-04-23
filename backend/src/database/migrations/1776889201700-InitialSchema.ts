import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1776889201700 implements MigrationInterface {
  name = 'InitialSchema1776889201700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'active', "subnetId" uuid NOT NULL, "createdById" uuid NOT NULL, "updatedById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c7e0cec8d2feb53801f29ffacf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5e4d06538c7c3f031606dfd449" ON "ips" ("subnetId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_f90ce919fe42e867b7b2384c2d" ON "ips" ("createdById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d00a6f0f0e2ad24022092c395" ON "ips" ("updatedById") `,
    );
    await queryRunner.query(
      `CREATE TABLE "subnets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cidr" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "totalIps" integer NOT NULL DEFAULT '0', "createdById" uuid NOT NULL, "updatedById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8cfb9718c7de1fb9413293f16e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_175edf5dee2b8c667dcd4ac493" ON "subnets" ("createdById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5d13a8cb6bd1f8246fa234dcc" ON "subnets" ("updatedById") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "refreshToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ips" ADD CONSTRAINT "FK_5e4d06538c7c3f031606dfd449a" FOREIGN KEY ("subnetId") REFERENCES "subnets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ips" ADD CONSTRAINT "FK_f90ce919fe42e867b7b2384c2d4" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ips" ADD CONSTRAINT "FK_0d00a6f0f0e2ad24022092c3954" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subnets" ADD CONSTRAINT "FK_175edf5dee2b8c667dcd4ac493b" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subnets" ADD CONSTRAINT "FK_e5d13a8cb6bd1f8246fa234dcca" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subnets" DROP CONSTRAINT "FK_e5d13a8cb6bd1f8246fa234dcca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subnets" DROP CONSTRAINT "FK_175edf5dee2b8c667dcd4ac493b"`,
    );
    await queryRunner.query(`ALTER TABLE "ips" DROP CONSTRAINT "FK_0d00a6f0f0e2ad24022092c3954"`);
    await queryRunner.query(`ALTER TABLE "ips" DROP CONSTRAINT "FK_f90ce919fe42e867b7b2384c2d4"`);
    await queryRunner.query(`ALTER TABLE "ips" DROP CONSTRAINT "FK_5e4d06538c7c3f031606dfd449a"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e5d13a8cb6bd1f8246fa234dcc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_175edf5dee2b8c667dcd4ac493"`);
    await queryRunner.query(`DROP TABLE "subnets"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0d00a6f0f0e2ad24022092c395"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f90ce919fe42e867b7b2384c2d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e4d06538c7c3f031606dfd449"`);
    await queryRunner.query(`DROP TABLE "ips"`);
  }
}
