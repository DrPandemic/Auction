'use strict';

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
  MaxRetryError = require('../../../src/crawler/lib/errors').MaxRetryError,
  ApiError = require('../../../src/crawler/lib/errors').ApiError;

require('../../../src/crawler/constants').DbName = 'wowTest';
var cleanDb = require('./model-test').cleanDb;

before((done) => {
  rejecter = Promise.onPossiblyUnhandledRejection;
  Promise.onPossiblyUnhandledRejection(undefined);

  item = rewire('../../../src/crawler/app/models/item');
  database.connect().then(cleanDb).then(done)
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

describe('item', () => {
  describe('find', () => {
    it('should be able to find an item if present', () => {
      return Promise.reject();
    });
    it('should rejects if tries to find unexisting item', () => {
      return item.find('test')
        .should.be.rejectedWith(NotFoundError);
    });
  });
  describe('fetch', () => {
    it('should succeed when the query succeed', () => {
      let client = item.__get__('client');
      let get = sinon.stub(client, 'get');

      get.callsArgWith(1, require('../../data/pet-cage'), {
        statusCode: 200
      });

      return item.fetch(42)
        .finally(() => {
          client.get.restore();
        }).should.become(require('../../data/pet-cage'));
    });
    it('should be rejected when the query returns an error', () => {
      let client = item.__get__('client');
      let get = sinon.stub(client, 'get');

      get.callsArgWith(1, require('../../data/pet-cage'), {
        statusCode: 400
      });

      return item.fetch(42)
        .finally(() => {
          client.get.restore();
        }).should.be.rejectedWith(ApiError);
    });
    describe('real data', () => {
      it('should be able to get an item (pet cage)', () => {
        return item.fetch(82800)
          .should.eventually.property('id', 82800);
      });

      it('should fails when the object doesn\'t exists', () => {
        return item.fetch(828000000)
          .should.be.rejectedWith(NotFoundError);
      });
    });
  });

  describe('findFetchAndSave', () => {
    it('should succeed if the item is already present in the db', () => {
      sinon.stub(item, 'find')
        .resolves(require('../../data/pet-cage'));

      sinon.stub(item, 'fetch')
        .rejects(new Error());

      return item.findFetchAndSave(82800)
        .finally(function(res) {
          item.find.restore();
          item.fetch.restore();
        }).should.become(require('../../data/pet-cage'));
    });
    it('should saves the item if it succeed', () => {
      let stub = sinon.stub(item.__get__('database'), 'insert');
      stub.resolves(require('../../data/pet-cage'));

      return item.findFetchAndSave(82800)
        .then((result) => {
          stub.called.should.be.true;
          result.should.be.equal(require('../../data/pet-cage'));
        }).finally(() => {
          item.__get__('database').insert.restore();
        });
    });
    it('should ask the API if not present in the DB', () => {
      let stub = sinon.stub(item, 'fetch')
        .resolves(require('../../data/pet-cage'));
      sinon.stub(item, 'find')
        .rejects(new NotFoundError());

      return item.findFetchAndSave(82800)
        .then((result) => {
          stub.called.should.be.true;
          result.should.be.equal(require('../../data/pet-cage'));
        })
        .finally(() => {
          item.fetch.restore();
          item.find.restore();
        });
    });
    it('shouldn\'t ask the API if present in the DB', () => {
      let stub = sinon.stub(item, 'fetch');
      sinon.stub(item, 'find')
        .resolves(require('../../data/pet-cage'));

      return item.findFetchAndSave(82800)
        .then((result) => {
          stub.called.should.be.false;
          result.should.be.equal(require('../../data/pet-cage'));
        })
        .finally(() => {
          item.fetch.restore();
          item.find.restore();
        });
    });
    it('should give an error when receive other errors', () => {
      sinon.stub(item, 'find')
        .rejects(new DatabaseError());
      return item.findFetchAndSave(82800)
        .finally(() => {
          item.find.restore();
        })
        .should.be.rejectedWith(DatabaseError);
    });
    it('should give an error if it was unable to save the object', () => {
      sinon.stub(item.__get__('database'), 'insert')
        .rejects(new DatabaseError());
      return item.findFetchAndSave(82800)
        .finally(() => {
          item.__get__('database').insert.restore();
        })
        .should.be.rejectedWith(DatabaseError);
    });
  });
});
