import * as fs from 'fs';
import * as Redis from 'ioredis';
import * as RedisScript from 'node-redis-script';

function makeRedisKey(key: string) {
  return 'throttler-d:' + key;
}

async function readFile(path: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, script) => {
      if (err) {
        return reject(err);
      }
      resolve(script);
    });
  })
}

export default async function (redis: Redis.Redis | false, redisOptions?: Redis.RedisOptions) {

  if (!redis) {
    if (!redisOptions) {
      return Promise.reject("neither ioredis object nor connection options were supplied")
    }
    redis = new Redis(redisOptions)
  }

  const script = await readFile(`${__dirname}/../lua/claimThrottleLock.lua`);


  const loadedScript = RedisScript.createScript({
    ioredis: redis
  }, script);
  async function throttle(key: string, throttleFn: CallableFunction, ttl: number, noRetry?: boolean | undefined /* Private */) {
    if (ttl === 0) {
      return throttleFn();
    }

    try {
      const expiresIn = await loadedScript(1, makeRedisKey(key), ttl)

      // If being throttled, wait for its expiration and try to run once more.
      if (expiresIn >= 0) {
        if (!noRetry) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(throttle(key, throttleFn, ttl, true /* No retry */))
            }, expiresIn);
          });
        }
      } else {
        return throttleFn();
      }
    } catch (err) {
      return throttleFn(err);
    }
  }

  return {
    call: throttle,
    cancel: (key: string) => {
      return redis && redis.del(makeRedisKey(key));
    }
  }
};
