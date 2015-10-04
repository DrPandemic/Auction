"use strict";

var rewire = require("rewire"),
  chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('lodash'),
  wowApi = null,
  database = null,
  wowDb = null,
  connErr = null,
  Promise = require('bluebird'),
  NotFoundError = require('../src/crawler/lib/errors').NotFoundError,
  rejecter = null;

require('sinon-as-promised')(Promise);

var should = chai.Should();
chai.use(chaiAsPromised);

before(function(done) {
  wowApi = rewire('../src/crawler/lib/wow-api');
  database = rewire('../src/crawler/lib/database');
  database.init().then(function() {
    cleanDb(function() {
      wowDb = rewire('../src/crawler/lib/wow-db');
      require('../src/crawler/logger').verbose = -1;

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
      db.collection('item').remove(function(e) {
        if (e)
          console.error(e);
        cb();
      });
    });
  });
}

describe.skip('wow-db', function() {
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

    it('should test connection before every method calls', function() {
      var database = wowDb.__get__('database'),
        str = 'wow-db is not well initialized';
      wowDb.__set__('database', null);

      //Silence the unhandled exceptions
      var rejecter = Promise.onPossiblyUnhandledRejection;
      Promise.onPossiblyUnhandledRejection(undefined);

      var funcs = [
        wowDb.getItem(8),
        wowDb.getServers()
      ];

      return Promise.settle(funcs).then(function(results) {
        var res = results.reduce(function(prev, current) {
          return prev && current.isRejected() &&
            current.reason().message === str;
        }, true);

        wowDb.__set__('database', database);
        Promise.onPossiblyUnhandledRejection(rejecter);

        return res ? Promise.resolve() : Promise.reject(new Error(
          'At least one function didn\'t test the connection'));
      });
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
  describe('getServers', function() {
    it('should call wow-api', function() {
      var backup = wowDb.__get__('wowApi').getServers,
        stub = sinon.stub().resolves(require('./data/servers').realms);
      wowDb.__get__('wowApi').getServers = stub;

      return wowDb.getServers()
        .finally(function() {
          wowDb.__get__('wowApi').getServers = backup;

          stub.called.should.be.true;
        });
    });
    it('should save results', function() {
      var backup1 = wowDb.__get__('wowApi').getServers,
        stub1 = sinon.stub().resolves(require('./data/servers').realms);
      wowDb.__get__('wowApi').getServers = stub1;

      var backup = wowDb.__get__('database').setServers,
        stub = sinon.stub().resolves();
      wowDb.__get__('database').setServers = stub;

      return wowDb.getServers()
        .finally(function() {
          wowDb.__get__('wowApi').getServers = backup1;
          wowDb.__get__('database').setServers = backup;

          stub.called.should.be.true;
        });
    });
    it('should give an error if it was unable to save the object',
      function() {
        var backup = wowDb.__get__('database').setServers,
          stub = sinon.stub().rejects(new Error());
        wowDb.__get__('database').setServers = stub;

        var getServersBackup = wowDb.__get__('wowApi').getServers,
          setServersStub = sinon.stub().resolves(require('./data/servers'));
        wowDb.__get__('wowApi').getServers = setServersStub;

        return wowDb.getServers()
          .finally(function(res) {
            wowDb.__get__('database').setServers = backup;
            wowDb.__get__('wowApi').getServers = getServersBackup;

          }).should.be.rejected;
      });
  });

  describe.skip('real data', function() {
    describe('getItem', function() {
      it('should succeed with a good item id', function() {
        return wowDb.getItem(82800)
          .should.eventually.have.property('name', 'Pet Cage');
      });
      it('should be rejected with a bad item id', function() {
        return wowDb.getItem(-50)
          .should.be.rejected;
      });
    });
    describe('getServers', function() {
      it('should succeed', function() {
        return wowDb.getServers()
          .should.be.fulfilled;
      });
    });
  });
});
