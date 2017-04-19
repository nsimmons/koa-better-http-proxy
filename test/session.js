var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('preserveReqSession', function() {
  'use strict';

  this.timeout(10000);

  var app;

  beforeEach(function() {
    app = new Koa();
    app.use(proxy('httpbin.org'));
  });

  it('preserveReqSession', function(done) {
    var app = new Koa();
    app.use(function(req, res, next) {
      req.session = 'hola';
      next();
    });
    app.use(proxy('httpbin.org', {
      preserveReqSession: true,
      proxyReqOptDecorator: function(reqOpts, req) {
        assert(reqOpts.session, 'hola');
        return req;
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
