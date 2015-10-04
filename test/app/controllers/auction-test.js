"use strict";

let rewire = require('rewire'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  assert = chai.assert,
  Promise = require('bluebird'),
  NotFoundError = require('../../../src/crawler/lib/errors').NotFoundError,
  DatabaseError = require('../../../src/crawler/lib/errors').DatabaseError,
  ControllerError = require('../../../src/crawler/lib/errors').ControllerError,
  rejecter = null,
  auction = null,
  database = require('../../../src/crawler/app/helpers/database'),
  Auction = rewire('../../../src/crawler/app/controllers/auction');


require('sinon-as-promised')(Promise);

var should = chai.Should();
chai.use(chaiAsPromised);

require('../../../src/crawler/constants').DbName = 'wowTest';
var cleanDb = require('../models/model-test').cleanDb;

before((done) => {
  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);

  auction = new Auction();
  auction.init()
    .then(() => {
      return database.connect();
    })
    .then(cleanDb)
    .then(done)
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

describe('auction controller', () => {
  describe('real data', () => {
    describe('processQuery', () => {
      it('should reject when the query is not well formed', () => {
        return auction.receiveQuery({})
          .should.be.rejectedWith(ControllerError);
      });
      it('should succeed when the query is well formed', () => {
        let backup = Auction.__get__('auction'),
          fetchAndSaveDump = sinon.stub(backup, 'fetchAndSaveDump');

        fetchAndSaveDump.returns(Promise.resolve());

        return auction.receiveQuery({name: 'grim-batol'})
          .then(() => {
            backup.fetchAndSaveDump.restore();
            console.log(auction.lastError);
            should.not.exist(auction.lastError);
          });
      });
    });
  });
});
