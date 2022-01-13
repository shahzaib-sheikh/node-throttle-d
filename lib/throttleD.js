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
const fs_1 = require("fs");
const node_redis_script_1 = require("node-redis-script");
function makeRedisKey(key) {
    return 'throttler-d:' + key;
}
function default_1(redis) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs_1.readFile(`${__dirname}/lua/claimThrottleLock.lua`, 'utf-8', (err, script) => {
                if (err) {
                    return reject(err);
                }
                const loadedScript = node_redis_script_1.default.createScript({
                    ioredis: redis
                }, script);
                function throttle(key, throttleFn, ttl, noRetry /* Private */) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const expiresIn = yield loadedScript(1, makeRedisKey(key), ttl);
                            // If being throttled, wait for its expiration and try to run once more.
                            if (expiresIn >= 0) {
                                if (!noRetry) {
                                    setTimeout(() => throttle(key, throttleFn, ttl, true /* No retry */), expiresIn);
                                }
                            }
                            else {
                                throttleFn();
                            }
                        }
                        catch (err) {
                            throttleFn(err);
                        }
                    });
                }
                resolve({
                    call: throttle,
                    cancel: (key) => {
                        return redis.del(makeRedisKey(key));
                    }
                });
            });
        });
    });
}
exports.default = default_1;
;
