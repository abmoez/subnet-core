-- Subnet Core — Initial Schema
-- PostgreSQL 16+
-- Run: psql -U postgres -d subnet_core -f init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE "users" (
    "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
    "email"        character varying NOT NULL,
    "password"     character varying NOT NULL,
    "refreshToken" character varying,
    "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
);

-- ============================================================
-- Subnets
-- ============================================================
CREATE TABLE "subnets" (
    "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
    "cidr"         character varying NOT NULL,
    "name"         character varying NOT NULL,
    "description"  character varying,
    "totalIps"     integer           NOT NULL DEFAULT 0,
    "createdById"  uuid              NOT NULL,
    "updatedById"  uuid,
    "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    CONSTRAINT "PK_e8cfb9718c7de1fb9413293f16e" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_175edf5dee2b8c667dcd4ac493" ON "subnets" ("createdById");
CREATE INDEX "IDX_e5d13a8cb6bd1f8246fa234dcc" ON "subnets" ("updatedById");

-- ============================================================
-- IPs
-- ============================================================
CREATE TABLE "ips" (
    "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
    "address"      character varying NOT NULL,
    "name"         character varying NOT NULL,
    "description"  character varying,
    "status"       character varying NOT NULL DEFAULT 'active',
    "subnetId"     uuid              NOT NULL,
    "createdById"  uuid              NOT NULL,
    "updatedById"  uuid,
    "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP         NOT NULL DEFAULT now(),
    CONSTRAINT "PK_9c7e0cec8d2feb53801f29ffacf" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_5e4d06538c7c3f031606dfd449" ON "ips" ("subnetId");
CREATE INDEX "IDX_f90ce919fe42e867b7b2384c2d" ON "ips" ("createdById");
CREATE INDEX "IDX_0d00a6f0f0e2ad24022092c395" ON "ips" ("updatedById");

-- ============================================================
-- Foreign Keys
-- ============================================================
ALTER TABLE "subnets"
    ADD CONSTRAINT "FK_175edf5dee2b8c667dcd4ac493b"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "subnets"
    ADD CONSTRAINT "FK_e5d13a8cb6bd1f8246fa234dcca"
    FOREIGN KEY ("updatedById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "ips"
    ADD CONSTRAINT "FK_5e4d06538c7c3f031606dfd449a"
    FOREIGN KEY ("subnetId") REFERENCES "subnets"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ips"
    ADD CONSTRAINT "FK_f90ce919fe42e867b7b2384c2d4"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ips"
    ADD CONSTRAINT "FK_0d00a6f0f0e2ad24022092c3954"
    FOREIGN KEY ("updatedById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
