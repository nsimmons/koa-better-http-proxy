'use strict';

function copyProxyResHeadersToUserRes(container) {
  return new Promise(function(resolve) {
    var ctx = container.user.ctx;
    var rsp = container.proxy.res;

    if (!ctx.headerSent && ctx.status !== 504) {
      ctx.status = rsp.statusCode;
      Object.keys(rsp.headers)
      .filter(function(item) { return item !== 'transfer-encoding'; })
      .forEach(function(item) {
        ctx.set(item, rsp.headers[item]);
      });
    }

    resolve(container);
  });
}

module.exports = copyProxyResHeadersToUserRes;

