'use strict';

var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var http = require('http');
var proxy = require('../../');
var proxyTarget = require('../../test/support/proxyTarget');

describe('resolveProxyReqPath', function() {
  var server;

  this.timeout(10000);

  before(function() {
    var handlers = [{
      method: 'get',
      path: '/working',
      fn: function(req, res) {
        res.sendStatus(200);
      }
    }];

    server = proxyTarget(12345, 100, handlers);
  });

  after(function() {
    server.close();
  });

  describe('when author uses option proxyReqPathResolver', function() {
    it('the proxy request path is the result of the function', function(done) {
      var app = new Koa();
      var opts = {};
      opts.proxyReqPathResolver = function() { return '/working'; };
      app.use(proxy('localhost:12345', opts));

      agent(app.callback())
        .get('/failing')
        .expect(200)
        .end(done);
    });

    it('the proxyReqPathResolver method has access to request object', function(done) {
      var app = new Koa();
      var opts = {};
      opts.proxyReqPathResolver = function(ctx) {
        assert.ok(ctx.req instanceof http.IncomingMessage);
        return '/working';
      };
      app.use(proxy('localhost:12345', opts));

      agent(app.callback())
        .get('/foobar')
        .expect(200)
        .end(done);
    });

  });
});
