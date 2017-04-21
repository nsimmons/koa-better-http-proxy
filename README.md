# koa-better-http-proxy [![Build Status](https://travis-ci.org/nsimmons/koa-better-http-proxy.svg?branch=master)](https://travis-ci.org/nsimmons/koa-better-http-proxy) [![Downloads](https://img.shields.io/npm/dm/koa-better-http-proxy.png?style=flat-square)](https://www.npmjs.com/package/koa-better-http-proxy)

Koa middleware to proxy request to another host and pass response back. Based on [express-http-proxy](https://github.com/villadora/express-http-proxy).

## Install

```bash
$ npm install koa-better-http-proxy --save
```

## Usage
```js
proxy(host, options);
```

To proxy URLS to the host 'www.google.com':

```js
var proxy = require('koa-better-http-proxy');
var Koa = require('koa');

var app = new Koa();
app.use(proxy('www.google.com'));
```

If you wish to proxy only specific paths, you can use a router middleware to accomplish this. See [https://github.com/koajs/koa/wiki#routing-and-mounting](Koa routing middlewares).

### Options

#### port

The port to use for the proxied host.

```js
app.use(proxy('www.google.com', {
  port: 443
}));
```

#### headers

Additional headers to send to the proxied host.

```js
app.use(proxy('www.google.com', {
  headers: {
    'X-Special-Header': 'true'
  }
}));
```

#### preserveReqSession

Pass the session along to the proxied request

```js
app.use(proxy('www.google.com', {
  preserveReqSession: true
}));
```

#### proxyReqPathResolver (supports Promises)

Provide a proxyReqPathResolver function if you'd like to
operate on the path before issuing the proxy request.  Use a Promise for async
operations.

```js
app.use(proxy('localhost:12345', {
  proxyReqPathResolver: function(ctx) {
    return require('url').parse(ctx.url).path;
  }
}));
```

Promise form

```js
app.use(proxy('localhost:12345', {
  proxyReqPathResolver: function(ctx) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {   // do asyncness
        resolve(fancyResults);
      }, 200);
    });
  }
}));
```

#### filter

The ```filter``` option can be used to limit what requests are proxied.  Return ```true``` to execute proxy.

For example, if you only want to proxy get request:

```js
app.use(proxy('www.google.com', {
  filter: function(ctx) {
     return ctx.method === 'GET';
  }
}));
```

#### userResDecorator (supports Promise)

You can modify the proxy's response before sending it to the client.

##### exploiting references
The intent is that this be used to modify the proxy response data only.

Note:
The other arguments (proxyRes, ctx) are passed by reference, so
you *can* currently exploit this to modify either response's headers, for
instance, but this is not a reliable interface. I expect to close this
exploit in a future release, while providing an additional hook for mutating
the userRes before sending.

##### gzip responses

If your proxy response is gzipped, this program will automatically unzip
it before passing to your function, then zip it back up before piping it to the
user response.  There is currently no way to short-circuit this behavior.

```js
app.use(proxy('www.google.com', {
  userResDecorator: function(proxyRes, proxyResData, ctx) {
    data = JSON.parse(proxyResData.toString('utf8'));
    data.newProperty = 'exciting data';
    return JSON.stringify(data);
  }
}));
```

```js
app.use(proxy('httpbin.org', {
  userResDecorator: function(proxyRes, proxyResData) {
    return new Promise(function(resolve) {
      proxyResData.funkyMessage = 'oi io oo ii';
      setTimeout(function() {
        resolve(proxyResData);
      }, 200);
    });
  }
}));
```

#### limit

This sets the body size limit (default: `1mb`). If the body size is larger than the specified (or default) limit,
a `413 Request Entity Too Large`  error will be returned. See [bytes.js](https://www.npmjs.com/package/bytes) for
a list of supported formats.

```js
app.use(proxy('www.google.com', {
  limit: '5mb'
}));
```

#### proxyReqOptDecorator  (supports Promise form)

You can mutate the request options before sending the proxyRequest.
proxyReqOpt represents the options argument passed to the (http|https).request
module.

```js
app.use(proxy('www.google.com', {
  proxyReqOptDecorator: function(proxyReqOpts, ctx) {
    // you can update headers
    proxyReqOpts.headers['content-type'] = 'text/html';
    // you can change the method
    proxyReqOpts.method = 'GET';
    // you could change the path
    proxyReqOpts.path = 'http://dev/null'
    return proxyReqOpts;
  }
}));
```

You can use a Promise for async style.

```js
app.use(proxy('www.google.com', {
  proxyReqOptDecorator: function(proxyReqOpts, ctx) {
    return new Promise(function(resolve, reject) {
      proxyReqOpts.headers['content-type'] = 'text/html';
      resolve(proxyReqOpts);
    })
  }
}));
```

#### proxyReqBodyDecorator  (supports Promise form)

You can mutate the body content before sending the proxyRequest.

```js
app.use(proxy('www.google.com', {
  proxyReqBodyDecorator: function(bodyContent, ctx) {
    return bodyContent.split('').reverse().join('');
  }
}));
```

You can use a Promise for async style.

```js
app.use(proxy('www.google.com', {
  proxyReqBodyDecorator: function(proxyReq, ctx) {
    return new Promise(function(resolve, reject) {
      http.get('http://dev/null', function (err, res) {
        if (err) { reject(err); }
        resolve(res);
      });
    })
  }
}));
```

#### https

Normally, your proxy request will be made on the same protocol as the original
request.  If you'd like to force the proxy request to be https, use this
option.

```js
app.use(proxy('www.google.com', {
  https: true
}));
```

#### preserveHostHdr

You can copy the host HTTP header to the proxied express server using the `preserveHostHdr` option.

```js
app.use(proxy('www.google.com', {
  preserveHostHdr: true
}));
```

#### parseReqBody

The ```parseReqBody``` option allows you to control parsing the request body.
For example, disabling body parsing is useful for large uploads where it would be inefficient
to hold the data in memory.

This defaults to true in order to preserve legacy behavior.

When false, no action will be taken on the body and accordingly ```req.body``` will no longer be set.

Note that setting this to false overrides ```reqAsBuffer``` and ```reqBodyEncoding``` below.

```js
app.use(proxy('www.google.com', {
  parseReqBody: false
}));
```

#### reqAsBuffer

Note: this is an experimental feature.  ymmv

The ```reqAsBuffer``` option allows you to ensure the req body is encoded as a Node
```Buffer``` when sending a proxied request.   Any value for this is truthy.

This defaults to to false in order to preserve legacy behavior. Note that
the value of ```reqBodyEnconding``` is used as the encoding when coercing strings
(and stringified JSON) to Buffer.

Ignored if ```parseReqBody``` is set to false.

```js
app.use(proxy('www.google.com', {
  reqAsBuffer: true
}));
```

#### reqBodyEncoding

Encoding used to decode request body. Defaults to ```utf-8```.

Use ```null``` to preserve as Buffer when proxied request body is a Buffer. (e.g image upload)
Accept any values supported by [raw-body](https://www.npmjs.com/package/raw-body#readme).

The same encoding is used in the userResDecorator method.

Ignored if ```parseReqBody``` is set to false.

```js
app.use(proxy('httpbin.org', {
  reqBodyEncoding: null
}));
```


#### timeout

By default, node does not express a timeout on connections.
Use timeout option to impose a specific timeout.
Timed-out requests will respond with 504 status code and a X-Timeout-Reason header.

```js
app.use(proxy('httpbin.org', {
  timeout: 2000  // in milliseconds, two seconds
}));
```
