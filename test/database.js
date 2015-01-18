"use strict";

var DATA = require('../src/lib/database'),
  database = null,
  should = require('should'),
  connErr = null;

before(function(done){
  function ready(err) {
    connErr = err;
    done();
  }
  database = new DATA(ready);
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

  
});
