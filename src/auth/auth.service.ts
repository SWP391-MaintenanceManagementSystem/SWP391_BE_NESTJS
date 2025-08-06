import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountService } from 'src/account/account.service';
import { SignUpDTO } from './dto/signup.dto';
import { CreateAccountDTO } from 'src/account/dto/create-account';
import { comparePassword, hashPassword } from 'src/utils';
import { SignInDTO } from './dto/signin.dto';
import { TokenService, TokenType } from './token.service';
import { Account } from '@prisma/client';
import { JWT_Payload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private tokenService: TokenService,
  ) {}

  async signUp(signUpDTO: SignUpDTO) {
    const { email, password, confirmPassword, firstName, lastName } = signUpDTO;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingAccount = await this.accountService.getAccountByEmail(email);
    if (existingAccount) {
      throw new BadRequestException('Account with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const newAccount: CreateAccountDTO = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    };

    return await this.accountService.createAccount(newAccount);
  }

  async validateUser(signInDTO: SignInDTO): Promise<Account | null> {
    const account = await this.accountService.getAccountByEmail(
      signInDTO.email,
    );
    if (!account) {
      return null;
    }
    const isPasswordValid = await comparePassword(
      signInDTO.password,
      account.password,
    );
    if (!isPasswordValid) {
      return null;
    }
    return account;
  }

  async signIn(
    account: Account,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JWT_Payload = {
      email: account.email,
      sub: account.accountId,
      role: account.role,
    };

    const accessToken = await this.tokenService.generateToken(
      payload,
      TokenType.ACCESS,
    );

    const refreshToken = await this.tokenService.generateToken(
      payload,
      TokenType.REFRESH,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
