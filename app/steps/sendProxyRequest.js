'use strict';

var chunkLength = require('../../lib/chunkLength');

function sendProxyRequest(Container) {
  var ctx = Container.user.ctx;
  var bodyContent = Container.proxy.bodyContent;
  var reqOpt = Container.proxy.reqBuilder;
  var options = Container.options;

  return new Promise(function(resolve, reject) {
    var protocol = Container.proxy.requestModule;
    var proxyReq = protocol.request(reqOpt, function(rsp) {
      var chunks = [];
      rsp.on('data', function(chunk) { chunks.push(chunk); });
      rsp.on('end', function() {
        Container.proxy.res = rsp;
        Container.proxy.resData = Buffer.concat(chunks, chunkLength(chunks));
        resolve(Container);
      });
      rsp.on('error', reject);
    });
    var abortRequest = function() {
      proxyReq.abort();
    };
    var timeoutDuration = null;

    proxyReq.on('socket', function(socket) {
      var isSecure = Container.proxy.isSecure;
      var timeout = options.timeout;
      var connectTimeout = options.connectTimeout;
      // "secureConnect" includes time taken for "lookup" (dns), "connect" and "ready" events, as well as tls handshake.
      var eventListener = isSecure ? 'secureConnect' : 'connect';

      if (connectTimeout) {
        timeoutDuration = connectTimeout;
        socket.setTimeout(connectTimeout, abortRequest);

        socket.on(eventListener, function() {
          if (timeout) {
            timeoutDuration = timeout;
            socket.setTimeout(timeout, abortRequest);
          } else {
            // 0 to reset to the default of no timeout for the rest of the request
            socket.setTimeout(0);
          }
        });
      } else if (timeout) {
        timeoutDuration = timeout;
        socket.setTimeout(timeout, abortRequest);
      }
    });

    // TODO: do reject here and handle this later on
    proxyReq.on('error', function(err) {
    // reject(error);
      if (err.code === 'ECONNRESET') {
        ctx.set('X-Timout-Reason', 'koa-better-http-proxy timed out your request after ' + timeoutDuration + 'ms.');
        ctx.set('Content-Type', 'text/plain');
        ctx.status = 504;
        resolve(Container);
      } else {
        reject(err);
      }
    });

    // this guy should go elsewhere, down the chain
    if (options.parseReqBody) {
    // We are parsing the body ourselves so we need to write the body content
    // and then manually end the request.

      //if (bodyContent instanceof Object) {
        //throw new Error
        //debugger;
        //bodyContent = JSON.stringify(bodyContent);
      //}

      if (bodyContent.length) {
        proxyReq.write(bodyContent);
      }
      proxyReq.end();
    } else {
    // Pipe will call end when it has completely read from the request.
      ctx.req.pipe(proxyReq);
    }

    ctx.req.on('aborted', function() {
    // reject?
      proxyReq.abort();
    });
  });
}


module.exports = sendProxyRequest;
