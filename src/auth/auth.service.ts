import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountService } from 'src/account/account.service';
import { SignUpDTO } from './dto/signup.dto';
import { CreateAccountDTO } from 'src/account/dto/create-account';
import { comparePassword, hashPassword } from 'src/utils';
import { SignInDTO } from './dto/signin.dto';
import { TokenService } from './token.service';
import { Account, AuthProvider } from '@prisma/client';
import { JWT_Payload, TokenType } from './types';
import { EmailService } from 'src/email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import * as ms from 'ms';
import { OAuthUserDTO } from './dto/oauth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }

  getConfig() {
    return {
      AT_Expired: this.configService.get<ms.StringValue>('AC_EXPIRE_TIME'),
    }
  }

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

    const createBody: CreateAccountDTO = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    };

    const account = await this.accountService.createAccount(createBody);

    // send verification mail
    const activationCode = uuidv4();
    const expiredTime = ms(this.configService.get<ms.StringValue>('EMAIL_VERIFY_EXPIRE_TIME')!) / 1000;
    const activationData = {
      email: account?.email,
      createdAt: new Date().toISOString(),
    }
    await this.redisService.set(
      `activation:${activationCode}`,
      JSON.stringify(activationData),
      expiredTime
    );
    await this.redisService.set(
      `activation:account:${account?.email}`,
      activationCode,
      expiredTime
    );
    this.emailService.sendActivationEmail(email, firstName, activationCode);

    return account;
  }

  async validateUser(signInDTO: SignInDTO): Promise<Account | null> {
    const account = await this.accountService.getAccountByEmail(
      signInDTO.email,
    );
    if (!account) {
      return null;
    }
    if (account.provider.includes(AuthProvider.EMAIL)) {
      const isPasswordValid = await comparePassword(
        signInDTO.password,
        account.password!,
      );
      if (isPasswordValid) {
        return account;
      }
    }
    return null;
  }
  async signIn(
    account: Account,
  ): Promise<{ accessToken: string; refreshToken: string, account: Account }> {
    const payload: JWT_Payload = {
      email: account.email,
      sub: account.accountId,
      role: account.role,
      isVerified: account.isVerified,
    };

    const accessToken = await this.tokenService.generateToken(
      payload,
      TokenType.ACCESS,
    );

    const refreshToken = await this.tokenService.generateToken(
      payload,
      TokenType.REFRESH,
    );
    await this.tokenService.storeToken(account.accountId, refreshToken);
    return {
      accessToken,
      account,
      refreshToken,
    };
  }

  async signOut(userId: string, accessToken: string): Promise<void> {
    await this.tokenService.deleteToken(userId);
    const { exp } = await this.tokenService.decodeToken(accessToken, TokenType.ACCESS)
    const expiredTime = Date.now() + (exp! * 1000) - Date.now();
    await this.redisService.set(`bl:${accessToken}`, "1", expiredTime);
  }


  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not found');
    }
    const payload = await this.tokenService.verifyToken(refreshToken, TokenType.REFRESH);
    const storedToken = await this.tokenService.getToken(payload.sub);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }
    const { sub } = payload
    const accessToken = await this.tokenService.generateToken(payload, TokenType.ACCESS);
    await this.redisService.set(`accessToken:${sub}`, accessToken, ms(this.getConfig().AT_Expired!) / 1000);
    return { accessToken };
  }

  async verifyEmail(activationCode: string) {

    const data = await this.redisService.get(`activation:${activationCode}`);
    if (!data) {
      throw new BadRequestException('Invalid or expired activation code');
    }
    const { email } = JSON.parse(data);
    const account = await this.accountService.getAccountByEmail(email);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    // Activate email
    await this.accountService.activateAccount(email);
    // Delete activation codes
    await this.redisService.del(`activation:${activationCode}`);
    await this.redisService.del(`activation:account:${email}`);
  }

  async resendActivationEmail(email: string) {
    const account = await this.accountService.getAccountByEmail(email);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    const oldActivationCode = await this.redisService.get(`activation:account:${email}`);
    if (oldActivationCode) {
      await this.redisService.del(`activation:${oldActivationCode}`);
      await this.redisService.del(`activation:account:${email}`);
    }

    const activationCode = uuidv4();
    const expiredTime = ms(this.configService.get<ms.StringValue>('EMAIL_VERIFY_EXPIRE_TIME')!) / 1000;
    const activationData = {
      email: account.email,
      createdAt: new Date().toISOString(),
    };
    await this.redisService.set(
      `activation:${activationCode}`,
      JSON.stringify(activationData),
      expiredTime
    );
    await this.redisService.set(
      `activation:account:${account.email}`,
      activationCode,
      expiredTime
    );
    this.emailService.sendActivationEmail(account.email, account.firstName, activationCode);
  }

  async googleOAuthSignIn(oauthUser: OAuthUserDTO): Promise<{ accessToken: string; refreshToken: string }> {
    const account = await this.accountService.findOrCreateOAuthAccount(oauthUser);

    const payload: JWT_Payload = {
      email: account.email,
      sub: account.accountId,
      role: account.role,
      isVerified: account.isVerified,
    };

    const accessToken = await this.tokenService.generateToken(
      payload,
      TokenType.ACCESS,
    );

    const refreshToken = await this.tokenService.generateToken(
      payload,
      TokenType.REFRESH,
    );

    await this.tokenService.storeToken(account.accountId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
