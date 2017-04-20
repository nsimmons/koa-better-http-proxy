'use strict';

var ScopeContainer = require('./lib/scopeContainer');
var assert = require('assert');

var buildProxyReq                = require('./app/steps/buildProxyReq');
var copyProxyResHeadersToUserRes = require('./app/steps/copyProxyResHeadersToUserRes');
var decorateProxyReqBody         = require('./app/steps/decorateProxyReqBody');
var decorateProxyReqOpts         = require('./app/steps/decorateProxyReqOpts');
var decorateUserRes              = require('./app/steps/decorateUserRes');
var prepareProxyReq              = require('./app/steps/prepareProxyReq');
var resolveProxyHost             = require('./app/steps/resolveProxyHost');
var resolveProxyReqPath          = require('./app/steps/resolveProxyReqPath');
var sendProxyRequest             = require('./app/steps/sendProxyRequest');
var sendUserRes                  = require('./app/steps/sendUserRes');

module.exports = function proxy(host, userOptions) {
  assert(host, 'Host should not be empty');
  return function(ctx, next) {
    var container = new ScopeContainer(ctx, host, userOptions);

    // Skip proxy if filter is falsey.  Loose equality so filters can return
    // false, null, undefined, etc.
    if (!container.options.filter(ctx)) {
      return Promise.resolve(null).then(next);
    }

    return buildProxyReq(container)
      .then(resolveProxyHost)
      .then(decorateProxyReqOpts)
      .then(resolveProxyReqPath)
      .then(decorateProxyReqBody)
      .then(prepareProxyReq)
      .then(sendProxyRequest)
      .then(copyProxyResHeadersToUserRes)
      .then(decorateUserRes)
      .then(sendUserRes)
      .then(next);
  };
};
