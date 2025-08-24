import { Controller, Post, Req, UseGuards, Res, Get, BadRequestException, Query } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/signup.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Response, Request } from 'express';
import { Account } from '@prisma/client';
import { Public } from '../decorator/public.decorator';
import { Serialize } from 'src/interceptor/serialize.interceptor';
import { AccountResponseDTO } from './dto/account-response';
import { CurrentUser } from 'src/decorator/current-user.decorator';
export interface RequestWithUser extends Request {
  user: Account;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('/signup')
  @Serialize(AccountResponseDTO)
  async signUp(@Body() body: SignUpDTO) {
    const account = await this.authService.signUp(body);
    return {
      status: 'success',
      data: account,
      message: 'Sign up successful'
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signIn(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signIn(
      req.user!,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.RF_EXPIRE_TIME!, 10) || 15 * 60 * 1000,
    });
    return {
      status: 'success',
      accessToken,
      message: 'Sign in successful',
    };
  }

  @Get('/refresh-token')
  @Public()
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];

    const { accessToken } = await this.authService.refreshToken(refreshToken);
    return {
      status: 'success',
      accessToken,
      message: 'Refresh token successful',
    };
  }


  @Get('verify-email')
  @Public()
  async verifyEmail(@Query('code') code: string) {
    await this.authService.verifyEmail(code);
    return {
      status: 'success',
      message: 'Email verified successfully',
    };
  }

  @Post('resend-activation-email')
  @Public()
  async resendEmail(@Body('email') email: string) {
    await this.authService.resendActivationEmail(email);
    return {
      status: 'success',
      message: 'Resend activation email successfully',
    };
  }

}
