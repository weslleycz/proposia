import { Prisma } from '@prisma/client';

export class ProposalLog implements Prisma.ProposalLogCreateInput {
  id: string;
  proposal: Prisma.ProposalCreateNestedOneWithoutProposalLogInput;
  changedBy: Prisma.UserCreateNestedOneWithoutProposalLogInput;
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'VERSIONED' | 'DELETED';
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  createdAt: Date;
}
