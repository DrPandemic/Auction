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
  database.init('wowTest').then(function() {
    cleanDb(function() {
      wowDb = rewire('../src/crawler/lib/wow-db');
      wowApi.__get__('logger').verbose = -1;
      database.__get__('logger').verbose = -1;
      wowDb.__get__('logger').verbose = -1;

      wowDb.init(wowApi, database);

      rejecter = Promise.onPossiblyUnhandledRejection;
      Promise.onPossiblyUnhandledRejection(undefined);
      done();
    });
  });
});

after(function() {
  Promise.onPossiblyUnhandledRejection(rejecter);
});

afterEach(function(done) {
  cleanDb(done);
});

function cleanDb(cb) {
  var db = database.__get__('mongoDb');
  db.collection('auction').remove(function(e) {
    if (e)
      console.error(e);
    db.collection('itemQueue').remove(function(e) {
      if (e)
        console.error(e);
      db.collection('items').remove(function(e) {
        if (e)
          console.error(e);
        cb();
      });
    });
  });
}

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
          wowDb.__set__('wowApi', wowApi);
        }).should.be.rejected;
    });
  });

  describe('getItem', function() {
    it('should directly succeed if the item is already present in the db',
      function() {
        var backup = wowDb.__get__('wowApi').getItem,
          stub = sinon.stub().resolves();
        wowDb.__get__('wowApi').getItem = stub;

        return database.insertItem(require('./data/pet-cage'))
          .then(function() {
            return wowDb.getItem(82800);
          }).finally(function(res) {
            wowDb.__get__('wowApi').getItem = backup;

            stub.called.should.be.false;
            return res;
          }).should.become(require('./data/pet-cage'));
      });

    it('should ask the API if receive a NotFoundError', function() {
      var backup = wowDb.__get__('wowApi').getItem,
        stub = sinon.stub().resolves(require('./data/pet-cage'));
      wowDb.__get__('wowApi').getItem = stub;

      return wowDb.getItem(82800)
        .finally(function() {
          wowDb.__get__('wowApi').getItem = backup;

          stub.called.should.be.true;
        });
    });
    it('should give an error when receive other errors', function() {
      var backup = wowDb.__get__('database').getItem,
        stub = sinon.stub().rejects(new Error());
      wowDb.__get__('database').getItem = stub;

      return wowDb.getItem(82800)
        .finally(function() {
          wowDb.__get__('database').getItem = backup;
        }).should.be.rejected;
    });
    it('should give an error if it was unable to save the object',
      function() {
        var backup = wowDb.__get__('database').insertItem,
          stub = sinon.stub().rejects(new Error());
        wowDb.__get__('database').insertItem = stub;

        var getItemBackup = wowDb.__get__('wowApi').getItem,
          getItemStub = sinon.stub().resolves(require('./data/pet-cage'));
        wowDb.__get__('wowApi').getItem = getItemStub;

        return wowDb.getItem(82800)
          .finally(function() {
            wowDb.__get__('database').insertItem = backup;
            wowDb.__get__('wowApi').getItem = getItemBackup;

          }).should.be.rejected;
      });
  });
});
