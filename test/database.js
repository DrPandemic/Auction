"use strict";

var rewire = require("rewire"),
  should = require('should'),
  database = null,
  connErr = null;


before(function(done){
  function ready(err) {
    connErr = err;
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

  it('should be rewired', function (done) {
    var tmp = database.getServers();
    database.__set__('servers', []);
    tmp.should.not.eql(database.getServers());
    done();
  });
});
