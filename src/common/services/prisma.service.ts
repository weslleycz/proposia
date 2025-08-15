import { Injectable, OnModuleInit, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
@Global()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
