var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');
var http = require('http');

describe('agent', function() {
  'use strict';

  this.timeout(10000);

  it('agent', function(done) {
    var httpAgent = new http.Agent();
    var app = new Koa();
    app.use(proxy('httpbin.org', {
      agent: httpAgent,
      proxyReqOptDecorator: function(reqOpts, ctx) {
        assert(reqOpts.agent, httpAgent);
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
