var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('preserveReqSession', function() {
  'use strict';

  this.timeout(10000);

  it('preserveReqSession', function(done) {
    var app = new Koa();
    app.use(function(ctx, next) {
      ctx.session = 'hola';
      return Promise.resolve(null).then(next);
    });
    app.use(proxy('httpbin.org', {
      preserveReqSession: true,
      proxyReqOptDecorator: function(reqOpts, ctx) {
        assert(reqOpts.session, 'hola');
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
});
