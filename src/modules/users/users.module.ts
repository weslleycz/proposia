import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {
  BcryptService,
  EmailService,
  PrismaService,
  SendMailService,
} from 'src/common/services';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    BcryptService,
    SendMailService,
    EmailService,
  ],
})
export class UsersModule {}
