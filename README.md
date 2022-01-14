## Distributed Throttle

This module allows you to throttle the invocation of a function (just like [Underscore#throttle](http://underscorejs.org/#throttle)) across a distributed system. It is built on top of Redis. It will currently always call the function on the leading edge and the trailing edge, just like Underscore's default implementation.

## Installing

```bash
npm install throttler-d
```

## Using

```ts
// with `ioredis` object

import { IThrottlerD, ThrottledException, createThrottlerD } from 'throttler-d';
import * as redis from 'ioredis';

const redisConnection = new redis();

const throttler: IThrottlerD = createThrottlerD(redisConnection);

throttler
  .call(
    'groupKey',
    function(err) {
      if (err) {
        console.log('error!', err);
        return;
      }
      console.log('do something');
    },
    10000, // 10 seconds
  )
  .then(console.log)
  .catch(console.error);

// If you want to cancel any pending call such that the next invocation will fire immediately.
throttler
  .cancel('groupKey')
  .then(console.log)
  .catch(console.error);
```

This repo is forked from [mixmaxhq/node-distributed-throttle-function](https://github.com/mixmaxhq/node-distributed-throttle-function)
