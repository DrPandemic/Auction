"use strict";

var rewire = require("rewire"),
  should = require('should'),
  sinon = require('sinon'),
  async = require('async'),
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

  //That was only to test the rewire mondule
  it('should be rewired', function (done) {
    var tmp = database.getServers();
    database.__set__('servers', []);
    tmp.should.not.eql(database.getServers());
    database.__set__('servers', tmp);
    tmp.should.eql(database.getServers());
    done();
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
});
