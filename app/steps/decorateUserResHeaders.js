'use strict';

function decorateProxyResHeaders(container) {
  var ctx = container.user.ctx;
  var rsp = container.proxy.res;
  var modifierFn = container.options.userResHeadersDecorator;
  if (!modifierFn || ctx.status === 504) {
    return Promise.resolve(container);
  }
  return Promise.all(
    Object.keys(rsp.headers)
    .map(function(header) {
      return Promise.resolve(modifierFn(header, rsp.headers[header])).then(function(value) {
        return {
          headerName: header,
          newValue: value
        };
      });
    })
  )
  .then(function(modHeaders) {
    modHeaders.forEach(function(modHeaders) {
        ctx.set(modHeaders.headerName, modHeaders.newValue);
    });
    return container;
  });
}

module.exports = decorateProxyResHeaders;

