"use strict";

let rewire = require('rewire'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  assert = chai.assert,
  Promise = require('bluebird'),
  NotFoundError = require('../../../src/crawler/lib/errors').NotFoundError,
  DatabaseError = require('../../../src/crawler/lib/errors').DatabaseError,
  rejecter = null,
  auction = null,
  database = require('../../../src/crawler/app/helpers/database');

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
      return Promise.reject();
    });
    it('should only called once when retry = 0', () => {
      return Promise.reject();
    });
    it('should succeed', () => {
      return Promise.reject();
    });
    describe('api call', () => {
      it('should reject when doesn\'t receive a 200', function() {
        return Promise.reject();
      });
      it('should reject when receive malformed data', () => {
        return Promise.reject();
      });
    });
    describe('dump (getData)', () => {
      it('should reject when doesn\'t receive a 200', function() {
        return Promise.reject();
      });
      it('should reject when receive an request error', function() {
        return Promise.reject();
      });
      it('should reject when receive malformed data', () => {
        return Promise.reject();
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
