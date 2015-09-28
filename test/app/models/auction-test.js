"use strict";

let rewire = require('rewire'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  assert = chai.assert,
  Promise = require('bluebird'),
  NotFoundError = require('../../../src/crawler/lib/errors').NotFoundError,
  DatabaseError = require('../../../src/crawler/lib/errors').DatabaseError,
  MaxRetryError = require('../../../src/crawler/lib/errors').MaxRetryError,
  rejecter = null,
  auction = null,
  database = require('../../../src/crawler/app/helpers/database');

//require('../../../src/crawler/sLogger').activateAll();

require('sinon-as-promised')(Promise);

var should = chai.Should();
chai.use(chaiAsPromised);

function cleanDb() {
  return new Promise((resolve) => {
    var db = database.connection;
    db.collection('auction').remove((e) => {
      if (e)
        console.error(e);
      db.collection('itemQueue').remove((e) => {
        if (e)
          console.error(e);
        db.collection('item').remove((e) => {
          if (e)
            console.error(e);
          db.collection('server').remove((e) => {
            if (e)
              console.error(e);
            resolve();
          });
        });
      });
    });
  });
}

before((done) => {
  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);

  auction = rewire('../../../src/crawler/app/models/auction');
  database.connect('wowTest').then(cleanDb).then(done)
    .catch((e) => {
      console.error(done);
      throw new DatabaseError(e);
    });
});

after(() => {
  Promise.onPossiblyUnhandledRejection(rejecter);
});

afterEach(function(done) {
  cleanDb().then(done);
});

describe('auction', () => {
  describe('fetch dump', () => {
    it('should only retry the good amount of times', () => {
      let broke = false;
      let stub = sinon.stub().rejects();
      let backup = auction.__get__('query');
      auction.__set__('query', stub);

      return auction.fetchDump('grim-batol', 3)
        .catch((err) => {
          if (err instanceof MaxRetryError)
            broke = true;
          auction.__set__('query', backup);
          stub.callCount.should.be.equal(4);
          return Promise.resolve;
        }).finally(() => {
          broke.should.be.true;
        });
    });
    it('should only called once when retry = 0', () => {
      let broke = false;
      let stub = sinon.stub().rejects();
      let backup = auction.__get__('query');
      auction.__set__('query', stub);

      return auction.fetchDump('grim-batol', 0)
        .catch((err) => {
          if (err instanceof MaxRetryError)
            broke = true;
          auction.__set__('query', backup);
          stub.callCount.should.be.equal(1);
          return Promise.resolve;
        }).finally(() => {
          broke.should.be.true;
        });
    });
    it('should be able to succeed', () => {
      let stub = sinon.stub().resolves({
        results: require('../../data/auction-data-response')
      });
      let backup = auction.__get__('query');
      auction.__set__('query', stub);

      return auction.fetchDump('grim-batol', 0)
        .finally((err) => {
          auction.__set__('query', backup);
        }).should.be.fulfilled;
    });
    it('should be able to succeed (not stubing all the query())', () => {
      var client = {
          get: function(url, cb) {
            cb(require('../../data/auction-data'), {
              statusCode: 200
            });
            return {
              on: () => {}
            };
          }
        },
        backup = auction.__get__('client');

      auction.__set__('client', client);

      var request = function(opt, cb) {
          cb(null, {
            statusCode: 200
          }, require('../../data/auction-data-response'));
        },
        requestBackup = auction.__get__('request');
      auction.__set__('request', request);

      return auction.fetchDump('grim-batol', 0)
        .finally(function() {
          auction.__set__('client', backup);
          auction.__set__('request', requestBackup);
        }).should.be.fulfilled;
    });
    describe('api call (client)', () => {
      it('should reject when doesn\'t receive a 200', function() {
        var client = {
            get: function(url, cb) {
              cb(require('../../data/auction-data'), {
                statusCode: 400
              });
              return {
                on: () => {}
              };
            }
          },
          backup = auction.__get__('client');

        auction.__set__('client', client);

        var request = function(opt, cb) {
            cb(null, {
              statusCode: 200
            }, require('../../data/auction-data-response'));
          },
          requestBackup = auction.__get__('request');
        auction.__set__('request', request);

        return auction.fetchDump('grim-batol', 0)
          .finally(function() {
            auction.__set__('client', backup);
            auction.__set__('request', requestBackup);
          }).should.be.rejected;
      });
      it('should reject when receive malformed data', () => {
        var client = {
            get: function(url, cb) {
              cb({}, {
                statusCode: 200
              });
              return {
                on: () => {}
              };
            }
          },
          backup = auction.__get__('client');

        auction.__set__('client', client);

        var request = function(opt, cb) {
            cb(null, {
              statusCode: 200
            }, require('../../data/auction-data-response'));
          },
          requestBackup = auction.__get__('request');
        auction.__set__('request', request);

        return auction.fetchDump('grim-batol', 0)
          .finally(function() {
            auction.__set__('client', backup);
            auction.__set__('request', requestBackup);
          }).should.be.rejected;
      });
    });
    describe('dump (getData with request)', () => {
      it('should reject when doesn\'t receive a 200', function() {
        var client = {
            get: function(url, cb) {
              cb(require('../../data/auction-data'), {
                statusCode: 200
              });
              return {
                on: () => {}
              };
            }
          },
          backup = auction.__get__('client');

        auction.__set__('client', client);

        var request = function(opt, cb) {
            cb(null, {
              statusCode: 400
            }, require('../../data/auction-data-response'));
          },
          requestBackup = auction.__get__('request');
        auction.__set__('request', request);

        return auction.fetchDump('grim-batol', 0)
          .finally(function() {
            auction.__set__('client', backup);
            auction.__set__('request', requestBackup);
          }).should.be.rejected;
      });
      it('should reject when receive an request error', function() {
        var client = {
            get: function(url, cb) {
              cb(require('../../data/auction-data'), {
                statusCode: 200
              });
              return {
                on: () => {}
              };
            }
          },
          backup = auction.__get__('client');

        auction.__set__('client', client);

        var request = function(opt, cb) {
            cb({error: 'indeed'}, {
              statusCode: 200
            }, require('../../data/auction-data-response'));
          },
          requestBackup = auction.__get__('request');
        auction.__set__('request', request);

        return auction.fetchDump('grim-batol', 0)
          .finally(function() {
            auction.__set__('client', backup);
            auction.__set__('request', requestBackup);
          }).should.be.rejected;
      });
      it('should reject when receive malformed data', () => {
        var client = {
            get: function(url, cb) {
              cb(require('../../data/auction-data'), {
                statusCode: 200
              });
              return {
                on: () => {}
              };
            }
          },
          backup = auction.__get__('client');

        auction.__set__('client', client);

        var request = function(opt, cb) {
            cb(null, {
              statusCode: 200
            }, {});
          },
          requestBackup = auction.__get__('request');
        auction.__set__('request', request);

        return auction.fetchDump('grim-batol', 0)
          .finally(function() {
            auction.__set__('client', backup);
            auction.__set__('request', requestBackup);
          }).should.be.rejected;
      });
    });
  });
  describe('featch and save dump', () => {
    it('should succeed even whitout an array', function() {
      return Promise.reject();
    });
    it('should adds timestamp', function() {
      return Promise.reject();
    });

  });
  describe('real data', () => {
    it('should receive dump', () => {
      return Promise.reject();
    });
    it('should save a dump', () => {
      return Promise.reject();
    });
  });
});
