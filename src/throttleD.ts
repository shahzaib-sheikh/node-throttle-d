import RedisScript from 'node-redis-script';
import { Redis } from 'ioredis';
import { readFile } from 'fs';

function makeRedisKey(key: string) {
  return 'throttle-d:' + key;
}

export default async function (redis: Redis) {
  return new Promise((resolve, reject) => {
    readFile(`${__dirname}/lua/claimThrottleLock.lua`, 'utf-8', (err, script) => {
      if (err) {
        return reject(err);
      }
      const loadedScript = RedisScript.createScript({
        ioredis: redis
      }, script);
      async function throttle(key: string, throttleFn: CallableFunction, ttl: number, noRetry: boolean | undefined /* Private */) {
        try {
          const expiresIn = await loadedScript(1, makeRedisKey(key), ttl)

          // If being throttled, wait for its expiration and try to run once more.
          if (expiresIn >= 0) {
            if (!noRetry) {
              setTimeout(() => throttle(key, throttleFn, ttl, true /* No retry */), expiresIn);
            }
          } else {
            throttleFn();
          }
        } catch (err) {
          throttleFn(err);

        }
      }
      resolve(
        {
          call: throttle,
          cancel: (key: string) => {
            return redis.del(makeRedisKey(key));
          }
        }
      )
    });
  })
};
