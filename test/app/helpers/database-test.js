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
  database = rewire('../../../src/crawler/app/helpers/database'),
  _ = require('lodash');

require('sinon-as-promised')(Promise);

var should = chai.Should();
chai.use(chaiAsPromised);

var cleanDb = require('../models/model-test').cleanDb;

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

afterEach((done) => {
  cleanDb().then(done);
});

describe('database', () => {
  it('should be connected', () => {
    return database.ensureDB().should.be.fulfilled;
  });
  it('should test connection before every method calls', () => {
    let mongo = database.connection,
      str = 'There was an error with the DB connection';
    database.__set__('mongoDb', null);
    mongo.should.exist;

    // Silence the unhandled exceptions
    let rejecter = Promise.onPossiblyUnhandledRejection;
    Promise.onPossiblyUnhandledRejection(undefined);

    var funcs = [
          database.insert([], ''),
          database.close()
        ];

    return Promise.settle(funcs).then((results) => {
      var res = results.reduce((prev, current) => {
        return prev && current.isRejected() &&
          current.reason().message === str;
      }, true);

      database.__set__('mongoDb', mongo);
      Promise.onPossiblyUnhandledRejection(rejecter);

      return res ? Promise.resolve() : Promise.reject(new Error(
        'At least one function didn\'t test the connection'));
    });
  });
  it('close should call mongo connection close', () => {
    var mongo = database.connection;
    mongo.should.exist;

    var close = sinon.stub(mongo, 'close');

    return database.close()
      .then(() => {
        close.called.should.be.true;
        mongo.close.restore();
        database.__set__('mongoDb', mongo);
        database.__set__('initialized', true);
      });
  });

  describe('insert', () => {
    it('should insert a array', () => {
      var mongo = database.connection;
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        insert = sinon.stub(),
        doc = [{
          wow: 1
        }, {
          ok: 2
        }];

      insert.callsArg(2);
      newCollection.insert = insert;
      collection.withArgs('test').returns(newCollection);

      return database.insert(doc, 'test')
        .then(() => {
          newCollection.insert.calledWith(doc).should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });
    it('should insert a object', () => {
      var mongo = database.connection;
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        insert = sinon.stub(),
        doc = {
          wow: 1
        };

      insert.callsArg(2);
      newCollection.insert = insert;
      collection.withArgs('test').returns(newCollection);

      return database.insert(doc, 'test')
        .then(function() {
          newCollection.insert.calledWith(doc).should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });
    it('should be rejected when insert produce an error other than duplicate', () => {
      var mongo = database.connection;
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        insert = sinon.stub(),
        doc = {
          wow: 1
        };

      var error = require('../../data/mongo-duplicate-error');
      //Not 110000 which is duplicate
      error.code = 10;
      insert.callsArgWith(2, error);
      newCollection.insert = insert;
      collection.withArgs('test').returns(newCollection);

      return database.insert(doc, 'test')
        .finally(function() {
          database.__get__('mongoDb').collection.restore();
        }).should.be.rejected;
    });

    describe('real data', () => {
      it('close should cause errors to the next method calls', () => {
        let broke = false;

        return database.close()
          .then(() => {
            return database.insert([], 'test');
          }).catch((err) => {
            if (err instanceof DatabaseError)
              broke = true;
          }).finally(() => {
            broke.should.be.true;
            return database.connect('wowTest');
          });
      });

      describe('insert', () => {
        it('should insert an array', () => {
          let collection = "test",
            document = {
              foo: 'bar'
            },
            document1 = {
              foo: 'bar',
              again: 1
            };
          return database.count(document, collection)
            .then((result) => {
              result.should.be.eq(0);
              return database.insert([document, document1], collection);
            }).then(() => {
              return database.count({
                foo: 'bar'
              }, collection);
            }).then((result) => {
              result.should.be.eq(2);
            });
        });
        it('should insert an object', () => {
          let collection = "test",
            document = {
              foo: 'bar'
            };
          return database.count(document, collection)
            .then((result) => {
              result.should.be.eq(0);
              return database.insert(document, collection);
            }).then(() => {
              return database.count({
                foo: 'bar'
              }, collection);
            }).then((result) => {
              result.should.be.eq(1);
            });
        });
      });
    });
  });

  describe('findOne', () => {
    it('should only find one document', () => {
      let collection = "test",
        document = {
          foo: 'bar'
        };

      return database.count({}, collection)
        .then((result) => {
          result.should.be.eq(0);
          return database.insert(document, collection);
        }).then(() => {
          return database.insert(document, collection);
        }).then(() => {
          return database.findOne({}, collection);
        }).then((result) => {
          _.isPlainObject(result).should.be.true;
          _.isString(result.foo).should.be.true;
        });
    });
    it('should failed with NotFoundError when no document found', () => {
      let collection = "test";
      return database.findOne({}, collection)
        .should.be.rejectedWith(NotFoundError);
    });
    it('should failed with DatabaseError when MongoDB bad trips', () => {
      let mongo = database.connection;
      mongo.should.exist;

      let collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub();

      let error = require('../../data/mongo-duplicate-error');
      //Not 110000 which is duplicate
      error.code = 10;
      findOne.callsArgWith(1, error);
      newCollection.findOne = findOne;
      collection.withArgs('test').returns(newCollection);

      return database.findOne({}, 'test')
        .finally(function() {
          database.__get__('mongoDb').collection.restore();
        }).should.be.rejectedWith(DatabaseError);
    });
  });

  describe('count', () => {
    it('should returns 0 when no documents follow the selector test', () => {
      let collection = "test";
      return database.count({}, collection)
        .then((result) => {
          result.should.be.eq(0);
        });
    });
    it('should returns the right amount of documents test', () => {
      let collection = "test";
      return database.count({}, collection)
        .then((result) => {
          result.should.be.eq(0);
          return database.insert({
            foo: 'bar'
          }, collection);
        }).then(() => {
          return database.count({}, collection);
        }).then((result) => {
          result.should.be.eq(1);
        });
    });
  });
});
