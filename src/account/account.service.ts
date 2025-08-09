import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDTO } from './dto/create-account';
import { Account } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) { }

  async createAccount(
    createAccountDto: CreateAccountDTO,
  ): Promise<Account | null> {
    const account = await this.prisma.account.create({
      data: createAccountDto,
    });
    return account;
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });
    return account;
  }
}
