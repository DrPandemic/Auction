"use strict";

var rewire = require("rewire"),
  chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('underscore'),
  database = null,
  connErr = null,
  Promise = require('bluebird'),
  NotFoundError = require('../src/crawler/lib/errors').NotFoundError;


require("mocha-as-promised")();

var should = chai.Should();
chai.use(chaiAsPromised);

before(function(done) {
  database = rewire('../src/crawler/lib/database');
  database.__get__('logger').verbose = -1;
  database.init().then(function() {
    done();
  }).catch(function(err) {
    connErr = err;
    done();
  });
});

describe('database', function() {
  it('should not return an error', function() {
    should.not.exist(connErr);
  });

  it('should be connected', function() {
    return database.connected().should.be.fulfilled;
  });

  it('should test connection before every method calls', function(done) {
    var mongo = database.__get__('mongoDb'),
      str = "There was an error with the DB connection";
    database.__set__('mongoDb', null);

    //Silence the unhandled exceptions
    var rejecter = Promise.onPossiblyUnhandledRejection;
    Promise.onPossiblyUnhandledRejection(undefined);

    var funcs = [
      database.insert([], ''),
      database.insertDump([], 0),
      database.close(),
      database.count('some'),
      database.containItem('some'),
      database.insertItem('some'),
      database.getSalesOccurence('some'),
      database.getSalesValueBuyout('some'),
      database.getSalesValueBid('some')
    ];

    return Promise.settle(funcs).then(function(results) {
      var res = results.reduce(function(prev, current) {
        return prev && current.isRejected() && current.reason()
          .message === str;
      }, true);

      database.__set__('mongoDb', mongo);
      Promise.onPossiblyUnhandledRejection(rejecter);

      return res ? Promise.resolve() : Promise.reject(new Error(
        'At least one function didn\'t test the connection'));
    });
  });

  describe('close', function() {
    it('should call mongo connection close', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var close = sinon.stub(mongo, 'close');

      return database.close()
        .then(function() {
          close.called.should.be.true;
          database.__get__('mongoDb').close.restore();
        });
    });
  });

  describe('insert', function() {
    it('should use a collection', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = sinon.stub(),
        insert = sinon.stub();

      insert.callsArg(2);
      newCollection.insert = insert;
      collection.withArgs('auction').returns(newCollection);

      return database.insert({
          test: 'test'
        }, 'auction')
        .then(function() {
          collection.calledWith('auction').should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should insert a array', function(done) {
      var mongo = database.__get__('mongoDb');
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
        .then(function() {
          newCollection.insert.calledWith(doc).should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should insert a object', function(done) {
      var mongo = database.__get__('mongoDb');
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

    describe('dump', function() {
      it('should succeed even whitout an array', function(
        done) {
        var mongo = database.__get__('mongoDb');
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

        return database.insertDump(doc, 0)
          .then(function() {
            newCollection.insert.called.should.be.true;
            database.__get__('mongoDb').collection.restore();
          });
      });

      it('should adds timestamp', function(done) {
        var mongo = database.__get__('mongoDb');
        mongo.should.exist;

        var collection = sinon.stub(mongo, 'collection'),
          newCollection = {},
          insert = sinon.stub(),
          doc = [{
            wow: 1
          }, {
            test: 2
          }];

        insert.callsArg(2);
        newCollection.insert = insert;
        collection.withArgs('auction').returns(newCollection);

        return database.insertDump(doc, 42)
          .then(function() {
            newCollection.insert.calledWith([{
              wow: 1,
              timestamp: 42
            }, {
              test: 2,
              timestamp: 42
            }]).should.be.true;
            database.__get__('mongoDb').collection.restore();
          });
      });
    });
  });

  describe('count', function() {
    it('should counts auction item', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        count = sinon.stub();

      count.callsArg(0);
      newCollection.count = count;
      collection.withArgs('auction').returns(newCollection);

      return database.count('grim-batol')
        .then(function(err, doc) {
          collection.calledWith('auction').should.be.true;
          count.called.should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should counts for a given server', function(done) {
      true.should.not.be.true;
      done();
    });
  });

  describe('find', function() {
    it(
      'should only returns an NotFoundError on when not finding an item',
      function(
        done) {
        var mongo = database.__get__('mongoDb');
        mongo.should.exist;

        var collection = sinon.stub(mongo, 'collection'),
          newCollection = {},
          findOne = sinon.stub(),
          id = 'foo';

        findOne.callsArgWithAsync(1);
        newCollection.findOne = findOne;
        collection.withArgs('items').returns(newCollection);

        return database.getItem(id)
          .then(function(doc) {
            database.__get__('mongoDb').collection.restore();
            assert.fail(doc, null, 'Shouldn\'t succeed');
          }).catch(function(err) {
            database.__get__('mongoDb').collection.restore();
            err.should.exist;
            err.should.to.have.property('name', 'NotFoundError');
          });
      });

    it('should return an item', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub(),
        id = 'foo',
        obj = {
          foo: 'bar'
        };

      findOne.callsArgWithAsync(1, null, obj);
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      return database.getItem(id)
        .then(function(doc) {
          doc.should.exist;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should returns an error when an error occurs', function(
      done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub(),
        id = 'foo';

      findOne.callsArgWithAsync(1, 'foo bar error');
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      return database.getItem(id)
        .then(function(doc) {
          assert.fail(doc, null, 'Shouldn\'t succeed');
          database.__get__('mongoDb').collection.restore();
        }).catch(function(err) {
          err.should.exist;
          err.should.to.have.property('name', 'Error');
          database.__get__('mongoDb').collection.restore();
        });
    });
  });

  describe('contain', function() {
    it('should returns an error when an error occurs', function(
      done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub(),
        id = 'foo';

      findOne.callsArgWithAsync(1, 'foo bar error');
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      return database.containItem(id)
        .then(function(doc) {
          assert.fail(doc, null, 'Shouldn\'t succeed');
          database.__get__('mongoDb').collection.restore();
        }).catch(function(err) {
          err.should.exist;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should returns true on success', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub(),
        id = 'foo',
        obj = {
          foo: 'bar'
        };

      findOne.callsArgWithAsync(1, null, obj);
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      return database.containItem(id)
        .then(function(doc) {
          doc.should.be.true;

          database.__get__('mongoDb').collection.restore();
        });
    });

    it('contain item, should returns false on failure', function(done) {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        findOne = sinon.stub(),
        id = 'foo',
        obj = null;

      findOne.callsArgWithAsync(1, null, obj);
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      return database.containItem(id)
        .then(function(doc) {
          doc.should.be.false;

          database.__get__('mongoDb').collection.restore();
        });
    });
  });

  it('pushItemQueue should try to add the item in mongo', function(done) {
    true.should.not.be.ok;
  });
  it('popItemQueue should return an object from the queue', function(done) {
    true.should.not.be.ok;
  });
});
