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
  describe('real data', () => {
    it('should succeed after being init', () => {
      return Promise.reject();
    });
    describe('processQuery', () => {
      it('should reject when the query is not well formed', () => {
        return Promise.reject();
      });
      it('should succeed when the query is well formed', () => {
        return Promise.reject();
      });
    });
  });
});
