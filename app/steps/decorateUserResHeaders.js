'use strict';

function decorateProxyResHeaders(container) {
  var ctx = container.user.ctx;
  var rsp = container.proxy.res;
  var modifierFn = container.options.userResHeadersDecorator;
  if (!modifierFn || ctx.status !== 504) {
    return Promise.resolve(container);
  }
  Promise.all(
    Object.keys(rsp.headers)
    .map(function (header) {
      return modifierFn(header, rsp.headers[header]).then(function (value) {
        return {
          headerName: header,
          newValue: value
        }
      });
    })
  )
  .then(function (modHeaders) {
    values.forEach(function (modHeaders) {
        ctx.set(modHeaders.headerName, modHeaders.newValue);
    });
    resolve(container);
  })
}

module.exports = decorateProxyResHeaders;

