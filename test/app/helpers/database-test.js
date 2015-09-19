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

describe('database', () => {
  it('should be connected', function() {
    return database.ensureDB().should.be.fulfilled;
  });
  it('should test connection before every method calls', function() {
    return Promise.reject();
  });
  it('close should call mongo connection close', function() {
    return Promise.reject();
  });
  describe('insert', () => {
    it('should insert a array', function() {
      return Promise.reject();
    });
    it('should insert a object', function() {
      return Promise.reject();
    });
    it('should be rejected when insert produce an error other than duplicate', function() {
      return Promise.reject();
    });
  });
});
