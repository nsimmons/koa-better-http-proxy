'use strict';

function copyProxyResHeadersToUserRes(container) {
  return new Promise(function(resolve) {
    var ctx = container.user.ctx;
    var rsp = container.proxy.res;
    var strippedHeaders = container.options.strippedHeaders || [];
    strippedHeaders = [
      ...strippedHeaders,
      'transfer-encoding',
      'connection'
    ]
    var userResHeadersDecorator = container.options.userResHeadersDecorator || function(headers) { return headers; };

    if (ctx.headerSent || ctx.status === 504) {
      return resolve(container);
    }
    ctx.status = rsp.statusCode;
    Promise.resolve(userResHeadersDecorator(rsp.headers)).then(function(decoratedHeaders) {
      Object.keys(decoratedHeaders)
      .filter(function(item) { return strippedHeaders.indexOf(item) < 0; })
      .forEach(function(item) {
        ctx.set(item, decoratedHeaders[item]);
      });
      resolve(container);
    });
  });
}

module.exports = copyProxyResHeadersToUserRes;
