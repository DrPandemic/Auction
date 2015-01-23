"use strict";

var rewire = require("rewire"),
  should = require('should'),
  sinon = require('sinon'),
  async = require('async'),
  _ = require('underscore'),
  database = null,
  connErr = null;


before(function(done){
  function ready(err) {
    connErr = err;

    done();
  }
  database = rewire('../src/lib/database');
  database.__get__('logger').verbose = -1;
  database.init(ready);
});

describe('database', function () {
  it('should not return an error', function (done) {
    should(connErr).not.be.ok;
    done();
  });

  it('should be connected', function (done) {
    database.connected(function(conn) {
      conn.should.be.true;
      done();
    });
  });

  it('should use a collection', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
      newCollection = sinon.stub(),
      insert = sinon.stub();

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    database.insert({test:'test'},function(){
      collection.calledWith('auction').should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('should insert the array', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
      newCollection = {},
      insert = sinon.stub(),
      doc = [{wow:1},{ok:2}];

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    database.insert(doc,function(){
      newCollection.insert.calledWith(doc).should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('should insert the object', function (done) {
    var mongo = database.__get__('mongoDb');
    mongo.should.be.ok;

    var collection = sinon.stub(mongo,'collection'),
      newCollection = {},
      insert = sinon.stub(),
      doc = {wow:1};

    insert.callsArg(2);
    newCollection.insert = insert;
    collection.withArgs('auction').returns(newCollection);

    database.insert(doc,function(){
      newCollection.insert.calledWith(doc).should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('should test connection before every method calls', function (done) {
    var mongo = database.__get__('mongoDb'),
      str = "There was an error with the DB connection";
    database.__set__('mongoDb', null);

    async.series([
      function(cb){
        database.insert([],function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.insertDump([],0,function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.close(function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.count('some',function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.containItem('some',function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.getSalesOccurence('some',function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.getSalesValueBuyout('some',function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      },
      function(cb){
        database.getSalesValueBid('some',function(err, doc) {
          should(err).be.eql(str);
          should(doc).not.be.ok;
          cb();
        });
      }
    ],function(err, results) {
      should(err).not.be.ok;
      should(results).be.ok;

      database.__set__('mongoDb', mongo);
      done();
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

    database.findItem(id,function(err, doc) {
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

    database.findItem(id,function(err, doc) {
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
});
