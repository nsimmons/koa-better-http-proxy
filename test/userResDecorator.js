'use strict';

var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('userResDecorator', function() {

  it('has access to original response', function(done) {
    var app = new Koa();
    app.use(proxy('httpbin.org', {
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
    app.use(proxy('httpbin.org', {
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
    .get('/ip')
    .end(function(err, res) {
      if (err) { return done(err); }

      assert(res.body.funkyMessage = 'oi io oo ii');
      done();
    });

  });

  it('can modify the response data', function(done) {
    var app = new Koa();
    app.use(proxy('httpbin.org', {
      userResDecorator: function(proxyRes, proxyResData) {
        proxyResData = JSON.parse(proxyResData.toString('utf8'));
        proxyResData.intercepted = true;
        return JSON.stringify(proxyResData);
      }
    }));

    agent(app.callback())
    .get('/ip')
    .end(function(err, res) {
      if (err) { return done(err); }

      assert(res.body.intercepted);
      done();
    });
  });


  it('can modify the response headers, [deviant case, supported by pass-by-reference atm]', function(done) {
    var app = new Koa();
    app.use(proxy('httpbin.org', {
      userResDecorator: function(rsp, data, ctx) {
        ctx.set('x-wombat-alliance', 'mammels');
        ctx.set('content-type', 'wiki/wiki');
        return data;
      }
    }));

    agent(app.callback())
    .get('/ip')
    .end(function(err, res) {
      if (err) { return done(err); }
      assert(res.headers['content-type'] === 'wiki/wiki');
      assert(res.headers['x-wombat-alliance'] === 'mammels');
      done();
    });
  });

  it('can mutuate an html response', function(done) {
    var app = new Koa();
    app.use(proxy('httpbin.org', {
      userResDecorator: function(rsp, data) {
        data = data.toString().replace('Oh', '<strong>Hey</strong>');
        assert(data !== '');
        return data;
      }
    }));

    agent(app.callback())
    .get('/html')
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

