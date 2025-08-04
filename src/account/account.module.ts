import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [],
  providers: [AccountService, PrismaService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
