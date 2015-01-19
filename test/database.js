"use strict";

var rewire = require("rewire"),
  should = require('should'),
  sinon = require('sinon'),
  database = null,
  connErr = null;


before(function(done){
  function ready(err) {
    connErr = err;
    database.__get__('logger').verbose = 0;
    done();
  }
  database = rewire('../src/lib/database');
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
      collection.called.should.be.true;
      database.__get__('mongoDb').collection.restore();
      done();
    });
  });

  it('should insert the document', function (done) {
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
});
