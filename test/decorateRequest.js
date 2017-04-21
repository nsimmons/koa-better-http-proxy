var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('proxyReqOptDecorator', function() {
  'use strict';

  this.timeout(10000);

  describe('Supports Promise and non-Promise forms', function() {

    describe('when proxyReqOptDecorator is a simple function (non Promise)', function() {
      it('should mutate the proxied request', function(done) {
        var app = new Koa();
        app.use(proxy('httpbin.org', {
          proxyReqOptDecorator: function(reqOpt) {
            reqOpt.headers['user-agent'] = 'test user agent';
            return reqOpt;
          }
        }));

        agent(app.callback())
        .get('/user-agent')
        .end(function(err, res) {
          if (err) { return done(err); }
          assert.equal(res.body['user-agent'], 'test user agent');
          done();
        });
      });
    });

    describe('when proxyReqOptDecorator is a Promise', function() {
      it('should mutate the proxied request', function(done) {
        var app = new Koa();
        app.use(proxy('httpbin.org', {
          proxyReqOptDecorator: function(reqOpt) {
            return new Promise(function(resolve) {
              reqOpt.headers['user-agent'] = 'test user agent';
              resolve(reqOpt);
            });
          }
        }));

        agent(app.callback())
        .get('/user-agent')
        .end(function(err, res) {
          if (err) { return done(err); }
          assert.equal(res.body['user-agent'], 'test user agent');
          done();
        });
      });
    });
  });

  describe('proxyReqOptDecorator has access to the source request\'s data', function() {
    it('should have access to ip', function(done) {
      var app = new Koa();
      app.use(proxy('httpbin.org', {
        proxyReqOptDecorator: function(reqOpts, ctx) {
          assert(ctx.ip);
          return reqOpts;
        }
      }));

      agent(app.callback())
      .get('/')
      .end(function(err) {
        if (err) { return done(err); }
        done();
      });

    });
  });
});
