'use strict';
var http = require('http');
var https = require('https');
var url = require('url');
var getRawBody = require('raw-body');
var isUnset = require('./isUnset');

function extend(obj, source, skips) {
  if (!source) {
    return obj;
  }

  for (var prop in source) {
    if (!skips || skips.indexOf(prop) === -1) {
      obj[prop] = source[prop];
    }
  }

  return obj;
}

function parseHost(Container) {
  var host = Container.params.host;
  var ctx =  Container.user.ctx;
  var options = Container.options;
  host = (typeof host === 'function') ? host(ctx) : host.toString();

  if (!host) {
    return new Error('Empty host parameter');
  }

  if (!/http(s)?:\/\//.test(host)) {
    host = 'http://' + host;
  }

  var parsed = url.parse(host);

  if (!parsed.hostname) {
    return new Error('Unable to parse hostname, possibly missing protocol://?');
  }

  var ishttps = options.https || parsed.protocol === 'https:';

  return {
    host: parsed.hostname,
    port: parsed.port || (ishttps ? 443 : 80),
    module: ishttps ? https : http,
  };
}

function reqHeaders(ctx, options) {
  var headers = options.headers || {};

  var skipHdrs = [ 'connection', 'content-length' ];
  if (!options.preserveHostHdr) {
    skipHdrs.push('host');
  }
  var hds = extend(headers, ctx.headers, skipHdrs);
  hds.connection = 'close';

  return hds;
}

function createRequestOptions(ctx, options) {
  // prepare proxyRequest
  var reqOpt = {
    headers: reqHeaders(ctx, options),
    method: ctx.method,
    path: ctx.path,
    // params: req.params,
  };

  if (options.preserveReqSession) {
    reqOpt.session = ctx.session;
  }

  return Promise.resolve(reqOpt);
}

// extract to bodyContent object
function bodyContent(ctx, options) {
  var parseReqBody = isUnset(options.parseReqBody) ? true : options.parseReqBody;

  function maybeParseBody(ctx, limit) {
    if (ctx.request.body) {
      return Promise.resolve(ctx.request.body);
    } else {
      // Returns a promise if no callback specified and global Promise exists.
      return getRawBody(ctx.req, {
        length: ctx.headers['content-length'],
        limit: limit,
      });
    }
  }

  if (parseReqBody) {
    return maybeParseBody(ctx, options.limit || '1mb');
  }
}


module.exports = {
  create: createRequestOptions,
  bodyContent: bodyContent,
  parseHost: parseHost
};
