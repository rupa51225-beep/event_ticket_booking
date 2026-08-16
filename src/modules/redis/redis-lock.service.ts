import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisLockService {
    private readonly logger = new Logger(RedisLockService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisClient: Redis,
    ) { }

    /**
     * Acquire atomic distributed lock for a key.
     * @param lockKey Key to lock (e.g. `lock:seat:uuid`)
     * @param ttlMs Time-to-live for the lock in milliseconds (default 5000ms)
     * @returns Lock token if acquired successfully, null otherwise.
     */
    async acquireLock(
        lockKey: string,
        ttlMs: number = 5000,
    ): Promise<string | null> {
        const lockToken = randomUUID();

        // SET lockKey lockToken PX ttlMs NX
        // NX: Only set the key if it does not already exist (Atomic)
        // PX: Set key expiration in milliseconds
        const result = await this.redisClient.set(
            lockKey,
            lockToken,
            'PX',
            ttlMs,
            'NX',
        );

        if (result === 'OK') {
            this.logger.debug(`Lock acquired: ${lockKey} (Token: ${lockToken})`);
            return lockToken;
        }

        this.logger.warn(`Failed to acquire lock: ${lockKey}`);
        return null;
    }

    /**
     * Safely release distributed lock using an atomic Lua script.
     * Prevents releasing a lock that has expired and been acquired by another request.
     */
    async releaseLock(lockKey: string, lockToken: string): Promise<boolean> {
        const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

        const result = await this.redisClient.eval(
            luaScript,
            1,
            lockKey,
            lockToken,
        );

        const isReleased = result === 1;
        if (isReleased) {
            this.logger.debug(`Lock released: ${lockKey}`);
        } else {
            this.logger.warn(`Failed to release lock or lock expired: ${lockKey}`);
        }
        return isReleased;
    }
}