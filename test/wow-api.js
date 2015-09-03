"use strict";

var rewire = require("rewire"),
  chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('underscore'),
  wowApi = null,
  connErr = null,
  Promise = require('bluebird'),
  NotFoundError = require('../src/crawler/lib/errors').NotFoundError,
  rejecter = null;

require("mocha-as-promised")();
require('sinon-as-promised')(Promise);

var should = chai.Should();
chai.use(chaiAsPromised);

before(function(done) {
  wowApi = rewire('../src/crawler/lib/wow-api');
  wowApi.__get__('logger').verbose = -1;

  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);
  done();
});

after(function() {
  Promise.onPossiblyUnhandledRejection(rejecter);
});

describe('wow-api', function() {
  describe('initial http query', function() {
    it('should reject when receive malformed data', function() {
      var client = {
          get: function(url, cb) {
            // Empty is malformed data
            cb();
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
        }).should.be.rejected;
    });
    it('should call getData when receive good data', function() {
      var client = {
          get: function(url, cb) {
            // Empty is malformed data
            cb(require('./data/auction-data'));
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);

      var backupGetData = wowApi.__get__('getData');
      var cb = sinon.stub().resolves();
      wowApi.__set__('getData', cb);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
          wowApi.__set__('getData', backupGetData);

          cb.calledOnce.should.be.true;
        }).should.be.resolved;
    });
  });

  describe('auction data (getData)', function() {
    it('should reject when receive an error', function() {
      var client = {
          get: function(url, cb) {
            cb(require('./data/auction-data'));
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);
      var backupGetData = wowApi.__get__('getData');

      var cb = sinon.stub().rejects(new Error());
      wowApi.__set__('getData', cb);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
          wowApi.__set__('getData', backupGetData);
        }).should.be.rejected;
    });

    it('should resolve with the right format', function() {
      var client = {
          get: function(url, cb) {
            cb(require('./data/auction-data'));
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);

      var request = function(opt, cb) {
          cb(null, {
            statusCode: 200
          }, require('./data/auction-data-response'));
        },
        requestBackup = wowApi.__get__('request');
      wowApi.__set__('request', request);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
          wowApi.__set__('request', requestBackup);
        }).should.become({
          timestamp: require('./data/auction-data').files[0].lastModified,
          results: require('./data/auction-data-response')
        });
    });

    it('should reject when doesn\'t receive a 200', function() {
      var client = {
          get: function(url, cb) {
            cb(require('./data/auction-data'));
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);

      var request = function(opt, cb) {
          cb(null, {
            statusCode: 400
          }, require('./data/auction-data-response'));
        },
        requestBackup = wowApi.__get__('request');
      wowApi.__set__('request', request);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
          wowApi.__set__('request', requestBackup);
        }).should.be.rejected;
    });

    it('should reject when receive an request error', function() {
      var client = {
          get: function(url, cb) {
            cb(require('./data/auction-data'));
          }
        },
        backup = wowApi.__get__('client');
      wowApi.__set__('client', client);

      var request = function(opt, cb) {
          cb({
            error: 'yup'
          }, {
            statusCode: 400
          }, require('./data/auction-data-response'));
        },
        requestBackup = wowApi.__get__('request');
      wowApi.__set__('request', request);

      return wowApi.query('grim-batol')
        .finally(function() {
          wowApi.__set__('client', backup);
          wowApi.__set__('request', requestBackup);
        }).should.be.rejected;
    });

    it.skip('should be able to get auction dump with queryWithRetry',
      function() {
        this.timeout(20 * 1000);
        return wowApi.queryWithRetry('grim-batol', 3);
      });

    it('should only retry the good amount of times', function() {
      var backup = wowApi.query;
      var stub = sinon.stub().rejects();
      wowApi.query = stub;
      return wowApi.queryWithRetry('grim-batol', 3)
      .catch(function() {
        wowApi.query = backup;
        stub.callCount.should.be.equal(4);
        return Promise.resolve;
      });
    });

    it('should only called once when retry = 0', function() {
      var backup = wowApi.query;
      var stub = sinon.stub().rejects();
      wowApi.query = stub;
      return wowApi.queryWithRetry('grim-batol', 0)
      .catch(function() {
        wowApi.query = backup;
        stub.callCount.should.be.equal(1);
        return Promise.resolve;
      });
    });
  });

});
