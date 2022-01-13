## Distributed Throttle

This module allows you to throttle the invocation of a function (just like [Underscore#throttle](http://underscorejs.org/#throttle)) across a distributed system. It is built on top of Redis. It will currently always call the function on the leading edge and the trailing edge, just like Underscore's default implementation.

## Installing

```bash
npm install throttle-d
```

## Using

```js
var ThrottleD = require('throttle-d');
var redis = require('ioredis');

var redisConnection = new redis();

var throttle = ThrottleD(redisConnection);

// This function will be called immediately unless it has been called less than 10 seconds ago.
// In that case, it will be called in 10 seconds—unless some _other_ call has happened in that interval.
throttle.call(
  'my10secThrottledFunction',
  function(err) {
    if (err) {
      console.log('error!', err);
      return;
    }

    console.log('This function will be called at most once (possibly zero times) within the next 10 seconds.');
  },
  10 * 1000 /* 10 sec */,
);

// If you want to cancel any pending call such that the next invocation will fire immediately.
throttle.cancel('my10secThrottledFunction', function(err) {
  if (err) {
    console.log('error!', err);
  }
});
```

This repo is forked from [mixmaxhq/node-distributed-throttle-function](https://github.com/mixmaxhq/node-distributed-throttle-function)
