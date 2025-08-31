import { Controller, Post, Req, UseGuards, Res, Get, BadRequestException, Query } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/signup.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { GoogleOauthGuard } from './guard/google-oauth.guard';
import { Response, Request } from 'express';
import { Public } from '../decorator/public.decorator';
import { Serialize } from 'src/interceptor/serialize.interceptor';
import { AccountResponseDTO } from './dto/account-response';
import { OAuthUserDTO } from './dto/oauth-user.dto';
import { CurrentUser } from 'src/decorator/current-user.decorator';
import { AccountDTO } from 'src/account/dto/account.dto';
import { JWT_Payload, TokenType } from 'src/types';
import { ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiTags, ApiHeader, ApiBearerAuth, ApiOperation, ApiCookieAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { SignInDTO } from './dto/signin.dto';


export interface RequestWithOAuthUser extends Omit<Request, 'user'> {
  user: OAuthUserDTO;
}

export interface RequestWithUserPayload extends Omit<Request, 'user'> {
  user: JWT_Payload
}


@ApiTags('Auth')
@Controller('api/auth')
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
  @Serialize(AccountResponseDTO)
  @Post('/signin')
  @ApiBody({ type: SignInDTO })
  async signIn(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, account } = await this.authService.signIn(
      req.user!,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.RF_EXPIRE_TIME!, 10) || 15 * 60 * 1000,
    });
    return {
      status: 'success',
      user: account,
      accessToken,
      message: 'Sign in successful',
    };
  }

  // @ApiHeader({ name: 'Authorization', required: true })
  @ApiBearerAuth('jwt-auth')
  @Post('signout')
  async signOut(@Req() req: RequestWithUserPayload) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.authService.signOut(req.user.sub, token!);
    return {
      status: 'success',
      message: 'Sign out successful',
    };
  }

  @Public()
  @Get('/refresh-token')
  @ApiCookieAuth('refreshToken')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies['refreshToken'];
    const { accessToken, refreshToken } = await this.authService.refreshToken(token);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.RF_EXPIRE_TIME!, 10) || 15 * 60 * 1000,
    });
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

  @Public()
  @ApiExcludeEndpoint()
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Initiates Google OAuth2 flow
  }

  @Public()
  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: RequestWithOAuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.googleOAuthSignIn(req.user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.RF_EXPIRE_TIME!, 10) || 7 * 24 * 60 * 60 * 1000,
    });

    // // Redirect to frontend with access token
    // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // return res.redirect(`${frontendUrl}/auth/success?token=${accessToken}`);
  }

  @Get("/me")
  @ApiBearerAuth('jwt-auth')
  async getMe(@CurrentUser() user: AccountDTO) {
    return user
  }

}
