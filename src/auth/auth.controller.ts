import { Controller, Post, Req, UseGuards, Res } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/signup.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Response, Request } from 'express';
import { Account } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: Account;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() body: SignUpDTO) {
    return await this.authService.signUp(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signIn(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signIn(
      req.user,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(process.env.RF_EXPIRE_TIME, 10) || 15 * 60 * 1000,
    });
    return {
      accessToken,
    };
  }
}
