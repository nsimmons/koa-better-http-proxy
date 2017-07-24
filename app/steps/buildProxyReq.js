'use strict';

var requestOptions = require('../../lib/requestOptions');

function buildProxyReq(Container) {
  var ctx = Container.user.ctx;
  var options = Container.options;
  var host = Container.proxy.host;

  var parseBody = (!options.parseReqBody) ? Promise.resolve(null) : requestOptions.bodyContent(ctx, options);
  var createReqOptions = requestOptions.create(ctx, options, host);

  return Promise
    .all([parseBody, createReqOptions])
    .then(function(responseArray) {
      Container.proxy.bodyContent = responseArray[0];
      Container.proxy.reqBuilder = responseArray[1];
      return Container;
    });
}

module.exports = buildProxyReq;
