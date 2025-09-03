import { Controller } from '@nestjs/common';
import { EmailService } from './email.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Controller('email')
export class EmailController {
  private readonly redis: Redis | null;
  constructor(
    private readonly emailService: EmailService,
    private readonly redisService: RedisService
  ) {
    this.redis = this.redisService.getOrThrow();
  }
}
