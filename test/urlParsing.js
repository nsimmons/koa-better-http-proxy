var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('url parsing', function() {
  'use strict';

  this.timeout(10000);

  it('can parse a url with a port', function(done) {
    var app = new Koa();
    app.use(proxy('http://httpbin.org:80'));
    agent(app.callback())
      .get('/')
      .end(function(err) {
        if (err) { return done(err); }
        assert(true);
        done();
      });
  });

  it('does not throw `Uncaught RangeError` if you have both a port and a trailing slash', function(done) {
    var app = new Koa();
    app.use(proxy('http://httpbin.org:80/'));
    agent(app.callback())
      .get('/')
      .end(function(err) {
        if (err) { return done(err); }
        assert(true);
        done();
      });
  });
});



