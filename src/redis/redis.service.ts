import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService as _RedisService } from '@liaoliaots/nestjs-redis';
@Injectable()
export class RedisService {
    private redisClient: Redis | null = null;
    private readonly logger = new Logger(RedisService.name);
    constructor(private readonly redisService: _RedisService) {
        this.redisClient = this.redisService.getOrThrow();
    }

    async set(key: string, value: string, ttl?: number): Promise<string> {
        if (ttl) {
            return await this.redisClient!.setex(key, ttl, value);
        }
        return await this.redisClient!.set(key, value);
    }

    async get(key: string): Promise<string | null> {
        return await this.redisClient!.get(key);
    }

    async del(key: string): Promise<number> {
        return await this.redisClient!.del(key);
    }
}
