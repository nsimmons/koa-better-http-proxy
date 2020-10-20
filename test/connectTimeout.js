var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');
var proxyTarget = require('./support/proxyTarget');

describe('honors connectTimeout option', function() {
  'use strict';

  var other, http;
  beforeEach(function() {
    http = new Koa();
    other = proxyTarget(8080, 1000, [{
      method: 'get',
      path: '/',
      fn: function(_, res) { res.sendStatus(200); }
    }]);
  });

  afterEach(function() {
    other.close();
  });

  function assertSuccess(server, done) {
    agent(server.callback())
      .get('/')
      .expect(200)
      .end(function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
  }

  function assertConnectionTimeout(server, time, done) {
    agent(server.callback())
      .get('/')
      .expect(504)
      .expect('X-Timout-Reason', 'koa-better-http-proxy timed out your request after ' + time + 'ms.')
      .end(function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
  }

  describe('when connectTimeout option is set lower than server connect time', function() {
    it('should fail with CONNECTION TIMEOUT', function(done) {
      http.use(proxy('http://127.0.0.0', {
        connectTimeout: 50,
      }));

      assertConnectionTimeout(http, 50, done);
    });
  });

  describe('when connectTimeout option is set higher than server connect time', function() {
    it('should succeed', function(done) {
      http.use(proxy('http://localhost:8080', {
        connectTimeout: 50,
      }));

      assertSuccess(http, done);
    });
  });

  describe('when timeout option is also used', function() {
    it('should fail with CONNECTION TIMEOUT when timeout is set lower than server response time', function(done) {
      http.use(proxy('http://localhost:8080', {
        connectTimeout: 100,
        timeout: 300,
      }));

      assertConnectionTimeout(http, 300, done);
    });

    it('should fail with CONNECTION TIMEOUT based on connectTimeout when a connection cannot be made', function(done) {
      http.use(proxy('http://127.0.0.0', {
        connectTimeout: 100,
        timeout: 300,
      }));

      assertConnectionTimeout(http, 100, done);
    });

    it('should succeed when timeout is higher than server response time', function(done) {
      http.use(proxy('http://localhost:8080', {
        connectTimeout: 100,
        timeout: 1200,
      }));

      assertSuccess(http, done);
    });
  });

});
