import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from 'src/decorator/public.decorator';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';


@Controller('email')
export class EmailController {
  private readonly redis: Redis | null;
  constructor(private readonly emailService: EmailService, private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }
  @Public()
  @Get('test')
  async testEmail() {
    const a = await this.redis?.set("test", "abc", "EX", 10);

    return "ok";
  }
}
