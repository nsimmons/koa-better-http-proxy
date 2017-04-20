var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('host can be a dynamic function', function() {
  'use strict';

  this.timeout(10000);

  var app = new Koa();
  var firstProxyApp = new Koa();
  var secondProxyApp = new Koa();
  var firstPort = 10001;
  var secondPort = 10002;

  app.use(proxy((ctx) => {
    return 'localhost:' + ctx.url.replace('/proxy/', '');
  }, {
    memoizeHost: false
  }));

  firstProxyApp.use((ctx) => {
    ctx.status = 204;
  });
  firstProxyApp.listen(firstPort);

  secondProxyApp.use((ctx) => {
    ctx.status = 200;
  });
  secondProxyApp.listen(secondPort);

  it('can proxy with session value', function(done) {
    agent(app.callback())
      .get('/proxy/' + firstPort)
      .expect(204)
      .end(function(err) {
        if (err) {
          return done(err);
        }
        agent(app.callback())
          .get('/proxy/' + secondPort)
          .expect(200, done);
      });
  });
});
