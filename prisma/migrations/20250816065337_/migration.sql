-- AlterTable
ALTER TABLE "public"."Proposal" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
