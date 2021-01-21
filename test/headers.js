var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('proxies headers', function() {
  'use strict';
  this.timeout(10000);

  var http;

  beforeEach(function() {
    http = new Koa();
    http.use(proxy('http://httpbin.org', {
      headers: {
        'X-Current-president': 'taft'
      }
    }));
  });

  it('does not include connection header by default', function(done) {
    var app = new Koa();
    app.use(proxy('httpbin.org', {
      proxyReqOptDecorator: function(reqOpts, ctx) {
        try {
          assert(!reqOpts.headers.connection);
        } catch (err) {
          done(err);
        }
        return ctx;
      }
    }));

    agent(app.callback())
      .get('/user-agent')
      .end(function(err) {
        if (err) { return done(err); }
        done();
      });
  });

  it('passed as options', function(done) {
    agent(http.callback())
      .get('/headers')
      .expect(200)
      .end(function(err, res) {
        if (err) { return done(err); }
        assert(res.body.headers['X-Current-President'] === 'taft');
        done();
      });
  });

  it('passed as on request', function(done) {
    agent(http.callback())
      .get('/headers')
      .set('X-Powerererer', 'XTYORG')
      .expect(200)
      .end(function(err, res) {
        if (err) { return done(err); }
        assert(res.body.headers['X-Powerererer']);
        done();
      });
  });

});
