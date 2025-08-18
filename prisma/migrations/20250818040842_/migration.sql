/*
  Warnings:

  - You are about to drop the column `parentId` on the `Proposal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Proposal" DROP CONSTRAINT "Proposal_parentId_fkey";

-- AlterTable
ALTER TABLE "public"."Proposal" DROP COLUMN "parentId";
