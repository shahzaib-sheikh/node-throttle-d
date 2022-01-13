import * as Redis from 'ioredis';
export default function (redis: Redis.Redis | false, redisOptions?: Redis.RedisOptions): Promise<{
    call: (key: string, throttleFn: CallableFunction, ttl: number, noRetry?: boolean | undefined) => Promise<any>;
    cancel: (key: string) => false | Promise<number>;
}>;
