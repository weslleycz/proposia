-- CreateEnum
CREATE TYPE "public"."ProposalAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'VERSIONED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."ProposalLog" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "action" "public"."ProposalAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProposalLog" ADD CONSTRAINT "ProposalLog_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalLog" ADD CONSTRAINT "ProposalLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
