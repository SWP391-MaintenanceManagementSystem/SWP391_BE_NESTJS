import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cache } from 'cache-manager';
@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

   onModuleInit() {
    // @ts-ignore
    console.log('Cache store type:', this.cacheManager.store?.constructor.name);
  }
  getClient() {
    // @ts-ignore - vì cacheManager.store có thể không khai báo rõ kiểu client
    return this.cacheManager.store.getClient();
  }

  async get<T>(key: string): Promise<T | null> {

    const value = await this.cacheManager.get<T>(key);
    return value || null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const result = await this.cacheManager.set(key, value, ttl);
      return Boolean(result);
    } catch (error) {
      console.error("Error setting cache:", error);
      return false;
    }
  }


  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

}
