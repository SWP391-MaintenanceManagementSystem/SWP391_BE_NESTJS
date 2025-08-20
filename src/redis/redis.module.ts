import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as _RedisModule } from '@liaoliaots/nestjs-redis';
@Global()
@Module({
  imports: [
    _RedisModule.forRoot({
      readyLog: true,
      config: {
        host: 'localhost',
        port: 6379,
      }
    }),
  ],
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule { }
