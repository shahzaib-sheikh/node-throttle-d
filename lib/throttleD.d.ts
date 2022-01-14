import * as Redis from 'ioredis';
export interface IThrottlerD {
    call: (key: string, throttleFn: CallableFunction, ttl: number, noRetry?: boolean | undefined) => Promise<any>;
    cancel: (key: string) => Promise<number | false>;
}
export declare class ThrottledException extends Error {
    private key;
    private ttl;
    constructor(key: string, ttl: number);
}
export declare function createThrottlerD(redis: Redis.Redis | false, redisOptions?: Redis.RedisOptions): Promise<IThrottlerD>;
