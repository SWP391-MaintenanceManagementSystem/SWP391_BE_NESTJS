import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const cacheMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      store: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
