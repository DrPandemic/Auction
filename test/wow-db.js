"use strict";

var rewire = require("rewire"),
  chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('underscore'),
  wowApi = null,
  database = null,
  wowDb = null,
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
  database = rewire('../src/crawler/lib/database');
  database.init();
  wowDb = rewire('../src/crawler/lib/wow-db');
  wowApi.__get__('logger').verbose = -1;
  database.__get__('logger').verbose = -1;
  wowDb.__get__('logger').verbose = -1;

  wowDb.init(wowApi, database);

  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);
  done();
});

after(function() {
  Promise.onPossiblyUnhandledRejection(rejecter);
});

describe('wow-db', function() {
  describe('ensure state', function() {
    it('should test if the db is present', function() {
      wowDb.__set__('database', null);
      return wowDb.getItem(82800)
        .finally(function() {
          wowDb.__set__('database', database);
        }).should.be.rejected;
    });
    it('should test if the db is connected', function() {
      wowDb.__set__('database', {
        connected: function() {
          return Promise.reject();
        },
        getItem: function() {
          return Promise.resolve(require('./data/pet-cage'));
        },
        insertItem: function() {
          return Promise.resolve();
        }
      });
      return wowDb.getItem(82800)
        .finally(function() {
          wowDb.__set__('database', database);
        }).should.be.rejected;
    });

    it('should test if the api is present', function() {
      wowDb.__set__('wowApi', null);
      return wowDb.getItem(82800)
        .finally(function() {
          wowDb.__set__('wowApi', database);
        }).should.be.rejected;
    });
  });

  describe('getItem', function() {
    it(
      'should directly succeed if the item is already present in the db',
      function() {
        return Promise.reject();
      });
    it('should ask the API if receive a NotFoundError', function() {
      return Promise.reject();
    });
    it('should give an error when receive other errors', function() {
      return Promise.reject();
    });
    it('should give an error if it was unable to save the object',
      function() {
        return Promise.reject();
      });
  });
});
