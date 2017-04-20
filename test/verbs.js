var assert = require('assert');
var Koa = require('koa');
var agent = require('supertest').agent;
var proxy = require('../');

describe('http verbs', function() {
  'use strict';
  this.timeout(10000);

  var app;

  beforeEach(function() {
    app = new Koa();
    app.use(proxy('httpbin.org'));
  });

  it('test proxy get', function(done) {
    agent(app.callback())
      .get('/get')
      .end(function(err, res) {
        if (err) { return done(err); }
        assert(/node-superagent/.test(res.body.headers['User-Agent']));
        assert.equal(res.body.url, 'http://httpbin.org/get');
        done(err);
      });
  });

  it('test proxy post', function(done) {
    agent(app.callback())
      .post('/post')
      .send({
        mypost: 'hello'
      })
      .end(function(err, res) {
        assert.equal(res.body.data, '{"mypost":"hello"}');
        done(err);
      });
  });

  it('test proxy put', function(done) {
    agent(app.callback())
      .put('/put')
      .send({
        mypost: 'hello'
      })
      .end(function(err, res) {
        assert.equal(res.body.data, '{"mypost":"hello"}');
        done(err);
      });
  });

  it('test proxy patch', function(done) {
    agent(app.callback())
      .patch('/patch')
      .send({
        mypost: 'hello'
      })
      .end(function(err, res) {
        assert.equal(res.body.data, '{"mypost":"hello"}');
        done(err);
      });
  });

  it('test proxy delete', function(done) {
    agent(app.callback())
      .del('/delete')
      .send({
        mypost: 'hello'
      })
      .end(function(err, res) {
        assert.equal(res.body.data, '{"mypost":"hello"}');
        done(err);
      });
  });
});
