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
  database = rewire('../../../src/crawler/app/helpers/database');

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
      collection.withArgs('auction').returns(newCollection);

      return database.insert(doc, 'auction')
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
      collection.withArgs('auction').returns(newCollection);

      return database.insert(doc, 'auction')
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
      collection.withArgs('auction').returns(newCollection);

      return database.insert(doc, 'auction')
        .finally(function() {
          database.__get__('mongoDb').collection.restore();
        }).should.be.rejected;
    });

    describe('real data', () => {
      it('close should cause errors to the next method calls', () => {
        let broke = false;

        return database.close()
          .then(() => {
            return database.insert([], 'auction');
          }).catch((err) => {
            if (err instanceof DatabaseError)
              broke = true;
          }).finally(() => {
            broke.should.be.true;
            return database.connect();
          });
      });

      // TODO: We need some func to read the DB.
      // I guess we could do it with the count
      describe('insert', () => {
        it('should insert a array', () => {
          return Promise.reject();
        });
        it('should insert a object', () => {
          return Promise.reject();
        });
      });
    });
  });
});
