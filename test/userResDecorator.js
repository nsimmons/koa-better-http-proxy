'use strict';

var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

function proxyTarget(port) {
  var other = new Koa();
  other.use(function(ctx, next) {
    if (ctx.request.url !== '/json') {
      return next();
    }
    ctx.set('content-type', 'app,lication/json');
    ctx.body = JSON.stringify({foo: 'bar'});
  });
  other.use(function(ctx) {
    ctx.status = 200;
    ctx.set('x-wombat-alliance', 'mammels');
    ctx.set('x-custom-header', 'something');
    ctx.body = 'Success';
  });
  return other.listen(port);
}

describe.only('userResDecorator', function() {
  var other;

  beforeEach(function() {
    other = proxyTarget(8080);
  });

  afterEach(function() {
    other.close();
  });

  it('has access to original response', function(done) {
    var app = new Koa();
    app.use(proxy('http://localhost', {
      port: 8080,
      userResDecorator: function(proxyRes, proxyResData) {
        assert(proxyRes.connection);
        assert(proxyRes.socket);
        assert(proxyRes.headers);
        assert(proxyRes.headers['content-type']);
        return proxyResData;
      }
    }));

    agent(app.callback()).get('/').end(done);
  });

  it('works with promises', function(done) {
    var app = new Koa();
    app.use(proxy('http://localhost', {
      port: 8080,
      userResDecorator: function(proxyRes, proxyResData) {
        return new Promise(function(resolve) {
          proxyResData.funkyMessage = 'oi io oo ii';
          setTimeout(function() {
            resolve(proxyResData);
          }, 200);
        });
      }
    }));

    agent(app.callback())
    .get('/')
    .end(function(err, res) {
      if (err) { return done(err); }

      assert(res.body.funkyMessage = 'oi io oo ii');
      done();
    });

  });

  it('can modify the response data', function(done) {
    var app = new Koa();
    app.use(proxy('http://localhost', {
      port: 8080,
      userResDecorator: function(proxyRes, proxyResData) {
        proxyResData = JSON.parse(proxyResData.toString('utf8'));
        proxyResData.intercepted = true;
        return JSON.stringify(proxyResData);
      }
    }));

    agent(app.callback())
    .get('/json')
    .end(function(err, res) {
      if (err) { return done(err); }

      assert(res.body.intercepted);
      done();
    });
  });

  it('can filter response headers', function(done) {
    var proxiedApp = new Koa();
    var app = new Koa();
    var p1Done, p2Done;
    var p1 = new Promise(function(resolve) { p1Done = resolve; });
    var p2 = new Promise(function(resolve) { p2Done = resolve; });
    app.use(proxy('http://localhost', {
      port: 8080
    }));
    proxiedApp.use(proxy('http://localhost', {
      port: 8080,
      strippedHeaders: ['x-wombat-alliance', 'x-custom-header']
    }));

    agent(app.callback())
    .get('/')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(typeof res.headers['x-custom-header'] === 'string');
      assert(typeof res.headers['x-wombat-alliance'] === 'string');
      p1Done();
    });

    agent(proxiedApp.callback())
    .get('/')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(typeof res.headers['x-custom-header'] !== 'string');
      assert(typeof res.headers['x-wombat-alliance'] !== 'string');
      p2Done();
    });

    Promise.all([p1, p2]).then(function() { done(); });
  });

  it('can modify the response headers', function(done) {
    var app = new Koa();
    app.use(proxy('http://localhost', {
      port: 8080,
      userResHeadersDecorator: function(headers) {
        var newHeaders = Object.keys(headers)
          .reduce(function(result, key) {
            result[key] = headers[key];
            return result;
          }, {});
        newHeaders['x-transaction-id'] = '12345';
        newHeaders['x-entity-id'] = 'abcdef';
        return newHeaders;
      }
    }));

    agent(app.callback())
    .get('/ip')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(res.headers['x-transaction-id'] === '12345');
      assert(res.headers['x-entity-id'] === 'abcdef');
      done();
    });
  });

  it('can mutuate an html response', function(done) {
    var app = new Koa();
    app.use(proxy('http://localhost', {
      port: 8080,
      userResDecorator: function(rsp, data) {
        data = data.toString().replace('Success', '<strong>Hey</strong>');
        assert(data !== '');
        return data;
      }
    }));

    agent(app.callback())
    .get('/')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(res.text.indexOf('<strong>Hey</strong>') > -1);
      done();
    });
  });

  it('can change the location of a redirect', function(done) {

    function redirectingServer(port, origin) {
      var app = new Koa();
      app.use(function(ctx) {
        ctx.redirect(origin + '/proxied/redirect/url');
      });
      return app.listen(port);
    }

    var redirectingServerPort = 8012;
    var redirectingServerOrigin = ['http://localhost', redirectingServerPort].join(':');

    var server = redirectingServer(redirectingServerPort, redirectingServerOrigin);

    var proxyApp = new Koa();
    var preferredPort = 3000;

    proxyApp.use(proxy(redirectingServerOrigin, {
      userResDecorator: function(rsp, data, ctx) {
        var proxyReturnedLocation = ctx.response.headers.location;
        ctx.set('location', proxyReturnedLocation.replace(redirectingServerPort, preferredPort));
        return data;
      }
    }));

    agent(proxyApp.callback())
    .get('/')
    .expect(function(res) {
      res.headers.location.match(/localhost:3000/);
    })
    .end(function() {
      server.close();
      done();
    });
  });
});


describe('test userResDecorator on html response from github',function() {
  /*
     Github provided a unique situation where the encoding was different than
     utf-8 when we didn't explicitly ask for utf-8.  This test helped sort out
     the issue, and even though its a little too on the nose for a specific
     case, it seems worth keeping around to ensure we don't regress on this
     issue.
  */

  it('is able to read and manipulate the response', function(done) {
    this.timeout(15000);  // give it some extra time to get response
    var app = new Koa();
    app.use(proxy('https://github.com/villadora/express-http-proxy', {
      userResDecorator: function(targetResponse, data) {
        data = data.toString().replace('DOCTYPE','WINNING');
        assert(data !== '');
        return data;
      }
    }));

    agent(app.callback())
    .get('/html')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(res.text.indexOf('WINNING') > -1);
      done();
    });

  });
});

