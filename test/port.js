var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

function proxyTarget(port) {
  'use strict';

  var other = new Koa();
  other.use(function(ctx) {
    ctx.status = 200;
    ctx.body = 'Success';
  });
  return other.listen(port);
}

describe('proxies to requested port', function() {
  'use strict';

  var other, http;
  beforeEach(function() {
    http = new Koa();
    other = proxyTarget(8080);
  });

  afterEach(function() {
    other.close();
  });

  function assertSuccess(server, done) {
    agent(http.callback())
    .get('/')
    .expect(200)
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(res.text === 'Success');
      done();
    });
  }

  describe('when host is a String', function() {
    it('when passed as an option', function(done) {
      http.use(proxy('http://localhost', {
        port: 8080
      }));
      assertSuccess(http, done);
    });

    it('when passed on the host string', function(done) {
      http.use(proxy('http://localhost:8080'));
      assertSuccess(http, done);
    });

  });

  describe('when host is a function', function() {
    it('and port is on the String returned', function(done) {
      http.use(proxy(
        function() { return 'http://localhost:8080'; }
      ));
      assertSuccess(http, done);
    });

    it('and port passed as an option', function(done) {
      http.use(proxy(
        function() { return 'http://localhost'; },
        { port: 8080 }
      ));
      assertSuccess(http, done);
    });
  });

});
