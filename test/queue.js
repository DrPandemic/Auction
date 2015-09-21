"use strict";

var rewire = require("rewire"),
  chai = require("chai"),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('lodash'),
  database = null,
  connErr = null,
  Promise = require('bluebird'),
  Queue = require('../src/crawler/lib/queue'),
  queue = new Queue();

var should = chai.Should();

describe('queue', function() {
  describe('pub/sub', function() {
    it('should be able to sub and receive a pub', function(done) {
      var mes = 'asdasdasdas',
        channel = 'test';
      queue.subscribe(channel, function(message) {
        message.should.be.equal(mes);

        queue.unsubscribe(channel);
        done();
      });
      queue.publish(channel, mes);
    });
    it('should not receive pub after unsubscription', function(done) {
      var mes = 'asdasdasdas',
        channel = 'test',
        called = false;
      queue.subscribe(channel, function(message) {
        called = true;
      });
      queue.unsubscribe(channel);
      queue.publish(channel, mes);
      setTimeout(function() {
        called.should.equal(false);
        done();
      }, 100);
    });
    it('should not receive message pub before sub', function(done) {
      var mes = 'asdasdasdas',
        channel = 'test',
        called = false;
      queue.publish(channel, mes);
      queue.subscribe(channel, function(message) {
        called = true;
      });
      setTimeout(function() {
        called.should.equal(false);
        queue.unsubscribe(channel);
        done();
      }, 100);
    });
  });
  describe('push/pop (oneListen)', function() {
    it('should test oneListen', () => {
      return Promise.reject();
    });
  });
});
