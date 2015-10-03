"use strict";

// Packages
let rewire = require('rewire'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  assert = chai.assert,
  Promise = require('bluebird');

require('sinon-as-promised')(Promise);
var should = chai.Should();
chai.use(chaiAsPromised);

// Vars
let rejecter = null,
  item = null,
  database = require('../../../src/crawler/app/helpers/database'),
  constants = require('../../../src/crawler/constants');

// Errors
let NotFoundError = require('../../../src/crawler/lib/errors').NotFoundError,
  DatabaseError = require('../../../src/crawler/lib/errors').DatabaseError,
  MaxRetryError = require('../../../src/crawler/lib/errors').MaxRetryError;

var cleanDb = require('./model-test').cleanDb;

before((done) => {
  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);

  item = rewire('../../../src/crawler/app/models/item');
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

describe('item', function() {
  describe('get', () => {
    it('should be able to find an item if present', () => {
      return Promise.reject();
    });
    it('should rejects if tries to find unexisting item', () => {
      return item.find('test')
        .should.be.rejectedWith(NotFoundError);
    });
  });
});
