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
Promise = require('bluebird');

require("mocha-as-promised")();

var should = chai.Should();
chai.use(chaiAsPromised);

before(function(done){
  database = rewire('../src/crawler/lib/database');
  database.__get__('logger').verbose = -1;
  database.init().then(function() {
    done();
  }).catch(function(err) {
    connErr = err;
    done();
  });
});

describe('database', function () {
  it('should not return an error', function () {
    should.not.exist(connErr);
  });

  it('should be connected', function () {
    return database.connected().should.be.fulfilled;
  });

  it('should use a collection', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.exist;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = sinon.stub(),
    insert = sinon.stub();

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    return database.insert({test:'test'},'auction')
    .then(function() {
      collection.calledWith('auction').should.be.true;
      database.__get__('mongoDb').collection.restore();
    });
  });

  it('should insert the array', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.exist;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    insert = sinon.stub(),
    doc = [{wow:1},{ok:2}];

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    return database.insert(doc,'auction')
    .then(function(){
      newCollection.insert.calledWith(doc).should.be.true;
      database.__get__('mongoDb').collection.restore();
    });
  });

  it('should insert the object', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.exist;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    insert = sinon.stub(),
    doc = {wow:1};

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    return database.insert(doc,'auction',function(){
      newCollection.insert.calledWith(doc).should.be.true;
      database.__get__('mongoDb').collection.restore();
    });
  });

  it('should test connection before every method calls', function (done) {
    var mongo = database.__get__('mongoDb'),
    str = "There was an error with the DB connection";
    database.__set__('mongoDb', null);

    //Silence the unhandled exceptions
    var rejecter = Promise.onPossiblyUnhandledRejection;
    Promise.onPossiblyUnhandledRejection(undefined);

    var funcs = [
      database.insert([],''),
      database.insertDump([],0),
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
        return prev && current.isRejected() && current.reason().message === str;
      }, true);

      database.__set__('mongoDb', mongo);
      Promise.onPossiblyUnhandledRejection(rejecter);

      return res ? Promise.resolve() : Promise.reject(new Error('At least one function didn\'t test the connection'));
    });
  });

  it('insert dump should not fail whitout an array', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    insert = sinon.stub(),
    doc = {wow:1};

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    database.insertDump(doc,0,function(){
      newCollection.insert.called.should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('insert dump should adds timestamp', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    insert = sinon.stub(),
    doc = [{wow:1},{test:2}];

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    database.insertDump(doc,42,function(){
      newCollection.insert.calledWith([{wow:1, timestamp:42},{test:2, timestamp:42}]).should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('close should call mongo connection close', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var close = sinon.stub(mongo,'close');

    database.close(function(err){
      should(err).not.be.ok;
      close.called.should.be.true;
      database.__get__('mongoDb').close.restore();
      done();
    });
  });

  it('count should counts auction item', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    count = sinon.stub();

    count.callsArg(0);
    newCollection.count = count;
    collection.withArgs('auction').returns(newCollection);

    database.count('grim-batol',function(err, doc) {
      collection.calledWith('auction').should.be.true;
      count.called.should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('count should counts for a given server', function (done) {
    true.should.not.be.ok;
    done();
  });

  it('find item, on error, only returns an error object', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    findOne = sinon.stub(),
    id = 'foo';

    findOne.callsArgWithAsync(1,'foo bar error');
    newCollection.findOne = findOne;
    collection.withArgs('items').returns(newCollection);

    database.getItem(id,function(err, doc) {
      should(err).should.exist;
      should(doc).should.not.exist;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('find item, on success, doesn\'t return an error, but returns the item', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    findOne = sinon.stub(),
    id = 'foo',
    obj = {foo:'bar'};

    findOne.callsArgWithAsync(1,null,obj);
    newCollection.findOne = findOne;
    collection.withArgs('items').returns(newCollection);

    database.getItem(id,function(err, doc) {
      should(err).should.not.exist;
      should(doc).should.exist;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('contain item, on error, only returns an error object', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    findOne = sinon.stub(),
    id = 'foo';

    findOne.callsArgWithAsync(1,'foo bar error');
    newCollection.findOne = findOne;
    collection.withArgs('items').returns(newCollection);

    database.containItem(id,function(err, doc) {
      should(err).should.exist;
      should(doc).should.not.exist;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('contain item, on success, doesn\'t return an error, but returns a bool', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
    newCollection = {},
    findOne = sinon.stub(),
    id = 'foo',
    obj = {foo:'bar'};

    findOne.callsArgWithAsync(1,null,obj);
    newCollection.findOne = findOne;
    collection.withArgs('items').returns(newCollection);

    database.containItem(id,function(err, doc) {
      should(err).should.not.exist;
      (_.isBoolean(doc)).should.be.true;

      //tests when the object is not found
      obj=null;
      findOne.callsArgWithAsync(1,null,obj);
      newCollection.findOne = findOne;
      collection.withArgs('items').returns(newCollection);

      database.containItem(id,function(err, doc) {
        should(err).should.not.exist;
        (_.isBoolean(doc)).should.be.true;
        database.__get__('mongoDb').collection.restore();
        done();
      });
    });
  });

  it('should do a mock to see if the DB receive the insert', function (done) {
    true.should.not.be.ok;
    done();
  });

  it('connected should always return a bool', function (done) {
    database.connected(function(res) {
      (_.isBoolean(res)).should.be.true;

      var mongo = database.__get__('mongoDb');
      mongo.should.be.ok;

      database.__set__('mongoDb',null);

      database.connected(function(res) {
        (_.isBoolean(res)).should.be.true;
        database.__set__('mongoDb',mongo);
        done();
      });
    });
  });

  it('pushItemQueue should try to add the item in mongo', function (done) {
    true.should.not.be.ok;
    done();
  });
  it('popItemQueue should return an object from the queue', function (done) {
    true.should.not.be.ok;
    done();
  });
});
