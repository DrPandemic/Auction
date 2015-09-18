"use strict";

var rewire = require('rewire'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  async = require('async'),
  assert = chai.assert,
  _ = require('lodash'),
  database = null,
  mapReducer = rewire('../src/crawler/lib/map-reducer'),
  connErr = null,
  Promise = require('bluebird'),
  NotFoundError = require('../src/crawler/lib/errors').NotFoundError,
  petCage = require('./data/pet-cage');

var should = chai.Should();
chai.use(chaiAsPromised);

before(function(done) {
  database = rewire('../src/crawler/lib/database');
  require('../src/crawler/logger').verbose = -1;
  database.init('wowTest').then(function() {
    cleanDb(done);
  }).catch(function(err) {
    connErr = err;
    done();
  });
});

afterEach(function(done) {
  cleanDb(done);
});

function cleanDb(cb) {
  var db = database.__get__('mongoDb');
  db.collection('auction').remove(function(e) {
    if (e)
      console.error(e);
    db.collection('itemQueue').remove(function(e) {
      if (e)
        console.error(e);
      db.collection('items').remove(function(e) {
        if (e)
          console.error(e);
        db.collection('servers').remove(function(e) {
          if (e)
            console.error(e);
          cb();
        });
      });
    });
  });
}

function insertPetCage() {
  return database.insertItem(petCage);
}

function insertAuctions() {
  return database.insertDump(require('./data/auctions'));
}

describe('database', function() {
  it('should not return an error', function() {
    should.not.exist(connErr);
  });

  it('should be connected', function() {
    return database.connected().should.be.fulfilled;
  });

  it('should test connection before every method calls', function() {
    var mongo = database.__get__('mongoDb'),
      str = 'There was an error with the DB connection';
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
      mapReducer.getSalesOccurence('some'),
      mapReducer.getSalesValueBuyout('some'),
      mapReducer.getSalesValueBid('some')
    ];

    return Promise.settle(funcs).then(function(results) {
      var res = results.reduce(function(prev, current) {
        return prev && current.isRejected() &&
          current.reason().message === str;
      }, true);

      database.__set__('mongoDb', mongo);
      Promise.onPossiblyUnhandledRejection(rejecter);

      return res ? Promise.resolve() : Promise.reject(new Error(
        'At least one function didn\'t test the connection'));
    });
  });

  describe('close', function() {
    it('should call mongo connection close', function() {
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
    it('should use a collection', function() {
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

    it('should insert a array', function() {
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

    it('should insert a object', function() {
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

    it('should be rejected when insert produce an error other than duplicate', function() {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        insert = sinon.stub(),
        doc = {
          wow: 1
        };

      var error = require('./data/mongo-duplicate-error');
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

    describe('dump', function() {
      it('should succeed even whitout an array', function() {
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

      it('should adds timestamp', function() {
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
    it('should counts auction item', function() {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        count = sinon.stub();

      newCollection.count = count;
      collection.withArgs('auction').returns(newCollection);

      return database.count('GrimBatol')
        .then(function() {
          collection.calledWith('auction').should.be.true;
          count.called.should.be.true;
          database.__get__('mongoDb').collection.restore();
        });
    });

    it('should counts for a given server', function() {
      return insertAuctions().then(function() {
        return database.count('GrimBatol');
      }).then(function(res) {
        res.should.be.equal(4);
      });
    });
  });

  describe('find', function() {
    it(
      'should only returns an NotFoundError on when not finding an item',
      function() {
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

    it('should return an item', function() {
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

    it('should returns an error when an error occurs', function() {
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
    it('should returns an error when an error occurs', function() {
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

    it('should returns true on success', function() {
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

    it('should returns false on failure', function() {
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

  describe('real DB', function() {
    describe('insert', function() {
      it('should insert an object', function() {
        return database.insert({
            test: 1
          }, 'auction')
          .then(function() {
            return database.count();
          })
          .should.become(1);
      });
      it('should insert an array', function() {
        var doc = [{
          auc: 10,
          ownerRealm: 'a',
          timestamp: 1
        }, {
          auc: 11,
          ownerRealm: 'a',
          timestamp: 1
        }];
        return database.insert(doc, 'auction')
          .then(function(res) {
            return database.count('a');
          })
          .should.become(doc.length);
      });
      it('should insert a dump', function() {
        var doc = [{
          auc: 10,
          ownerRealm: 'a'
        }, {
          auc: 11,
          ownerRealm: 'a'
        }];
        return database.insert(doc, 'auction')
          .then(function() {
            return database.count('a');
          })
          .should.become(doc.length);
      });
      it('should insert a dump even with one object', function() {
        var doc = [{
          auc: 10,
          ownerRealm: 'a'
        }];
        return database.insert(doc, 'auction')
          .then(function() {
            return database.count('a');
          })
          .should.become(doc.length);
      });

      it('should not insert duplicate but still insert a complete dump', function() {
        var doc = [{
          auc: 10,
          ownerRealm: 'a'
        }, {
          auc: 10,
          ownerRealm: 'a'
        }, {
          auc: 11,
          ownerRealm: 'a'
        }, {
          auc: 11,
          ownerRealm: 'a'
        }];
        return database.insert(doc, 'auction')
          .then(function() {
            return database.count('a');
          })
          .should.become(2);
      });
    });


    describe('items', function() {
      it('should be able to get the pet cage', function() {
        return insertPetCage()
          .then(function() {
            return database.getItem(82800)
              .should.eventually.have.property('name',
                'Pet Cage');
          });
      });
      it('should fail to get not inserted item', function() {
        return insertPetCage()
          .then(function() {
            return database.getItem(0)
              .should.be.rejected;
          });
      });
      it('should contains the pet cage', function() {
        return insertPetCage()
          .then(function() {
            return database.containItem(82800)
              .should.become(true);
          });
      });
      it('should not contains not inserted item', function() {
        return insertPetCage()
          .then(function() {
            return database.containItem(828004)
              .should.become(false);
          });
      });
    });

    describe.skip('map-reduce', function() {
      it('should get the right sale occurence', function() {
        return insertAuctions()
          .then(function() {
            return database.getSalesOccurence('GrimBatol');
          }).should.become([{
            _id: 37770,
            value: 2
          }, {
            _id: 821,
            value: 1
          }, {
            _id: 16817,
            value: 1
          }]);
      });
      it('should get the right sale value at buyout', function() {
        return insertAuctions()
          .then(function() {
            return database.getSalesValueBuyout('GrimBatol');
          }).should.become([{
            _id: 821,
            value: {
              amount: 1,
              value: 5703747
            }
          }, {
            _id: 16817,
            value: {
              amount: 1,
              value: 3119999
            }
          }, {
            _id: 37770,
            value: {
              amount: 2,
              value: 1018998
            }
          }]);
      });
      //It crashes mongodb...
      it('should get the right sale value at bid', function() {
        return insertAuctions()
          .then(function() {
            return database.getSalesValueBid('GrimBatol');
          }).should.become([{
            _id: 37770,
            value: 949098
          }, {
            _id: 16817,
            value: 2963999
          }, {
            _id: 821,
            value: 5418559
          }]);
      });
    });

    describe('severs', function() {
      it('should contains exactly what was inserted', function() {
        var servers = require('./data/servers').realms;
        return database.setServers([servers[0]])
          .then(function() {
            return database.getServers();
          }).should.become([servers[0]]);
      });

      it('should not contains old inserts', function() {
        var servers = require('./data/servers').realms;
        return database.setServers([servers[0]])
          .then(function() {
            return database.setServers([servers[1]]);
          }).then(function() {
            return database.getServers();
          }).should.eventually.not.contain(servers[0]);
      });
    });
  });

  describe('servers', function() {
    it('should reject when trying to insert not an array', function() {
      return database.setServers({
          foo: 1
        })
        .should.be.rejected;
    });
    it('should reject when trying to insert malformed servers', function() {
      return database.setServers([{
          foo: 1
        }])
        .should.be.rejected;
    });
    it('should succeed with good servers', function() {
      return database.setServers(require('./data/servers').realms)
        .should.be.fulfilled;
    });
    it('should reject when the DB produce an error on insert', function() {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        insert = sinon.stub(),
        doc = [{
          wow: 1
        }];

      var error = require('./data/mongo-duplicate-error');
      //Not 110000 which is duplicate
      error.code = 10;
      insert.callsArgWith(2, error);
      newCollection.insert = insert;
      collection.withArgs('servers').returns(newCollection);

      return database.setServers(doc)
        .finally(function() {
          database.__get__('mongoDb').collection.restore();
        }).should.be.rejected;
    });
    it('should reject when the DB produce an error on remove', function() {
      var mongo = database.__get__('mongoDb');
      mongo.should.exist;

      var collection = sinon.stub(mongo, 'collection'),
        newCollection = {},
        remove = sinon.stub(),
        doc = [{
          wow: 1
        }];

      var error = require('./data/mongo-duplicate-error');
      //Not 110000 which is duplicate
      error.code = 10;
      remove.callsArgWith(1, error);
      newCollection.remove = remove;
      collection.withArgs('servers').returns(newCollection);

      return database.setServers(doc)
        .finally(function() {
          database.__get__('mongoDb').collection.restore();
        }).should.be.rejected;
    });
  });
});
