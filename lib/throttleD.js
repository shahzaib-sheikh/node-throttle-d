"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottledException = void 0;
const fs = require("fs");
const Redis = require("ioredis");
const RedisScript = require("node-redis-script");
function makeRedisKey(key) {
    return 'throttler-d:' + key;
}
function readFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf-8', (err, script) => {
                if (err) {
                    return reject(err);
                }
                resolve(script);
            });
        });
    });
}
class ThrottledException extends Error {
    constructor(key, ttl) {
        super(`Function call throttled with key {${key}} ttl {${ttl}}`);
        this.key = key;
        this.ttl = ttl;
    }
}
exports.ThrottledException = ThrottledException;
function default_1(redis, redisOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!redis) {
            if (!redisOptions) {
                return Promise.reject("neither ioredis object nor connection options were supplied");
            }
            redis = new Redis(redisOptions);
        }
        const script = yield readFile(`${__dirname}/../lua/claimThrottleLock.lua`);
        const loadedScript = RedisScript.createScript({
            ioredis: redis
        }, script);
        function throttle(key, throttleFn, ttl, noRetry /* Private */) {
            return __awaiter(this, void 0, void 0, function* () {
                if (ttl === 0) {
                    return throttleFn();
                }
                try {
                    const expiresIn = yield loadedScript(1, makeRedisKey(key), ttl);
                    // If being throttled, wait for its expiration and try to run once more.
                    if (expiresIn >= 0) {
                        if (!noRetry) {
                            return new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    resolve(throttle(key, throttleFn, ttl, true /* No retry */));
                                }, expiresIn);
                            });
                        }
                        else {
                            return Promise.reject(new ThrottledException(key, ttl));
                        }
                    }
                    else {
                        return throttleFn();
                    }
                }
                catch (err) {
                    return throttleFn(err);
                }
            });
        }
        return {
            call: throttle,
            cancel: (key) => __awaiter(this, void 0, void 0, function* () {
                return redis && (yield redis.del(makeRedisKey(key)));
            })
        };
    });
}
exports.default = default_1;
;
