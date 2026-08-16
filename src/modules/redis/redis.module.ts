import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisLockService, REDIS_CLIENT } from './redis-lock.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        return new Redis({ host, port });
      },
      inject: [ConfigService],
    },
    RedisLockService,
  ],
  exports: [REDIS_CLIENT, RedisLockService],
})
export class RedisModule { }