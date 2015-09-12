"use strict";

var dataProcess = {},
  mongoClient = require('mongodb').MongoClient,
  logger = require('../logger'),
  mongoDb = null,
  async = require('async'),
  _ = require('lodash'),
  sorts = {},
  reducers = {},
  tQueueItem = 'itemQueue',
  Promise = require('bluebird'),
  NotFoundError = require('./errors').NotFoundError;

sorts.double = {};

sorts.asc = function(a, b) {
  return a.value - b.value;
};
sorts.double.asc = function(a, b) {
  return a.value.value - b.value.value;
};
sorts.double.des = function(b, a) {
  return a.value.value - b.value.value;
};
sorts.des = function(b, a) {
  return a.value - b.value;
};
sorts.void = function(b, a) {
  return false;
};
reducers.normal = function(key, values) {
  return Array.sum(values);
};
reducers.double = function(key, values) {
  var res = values[0];
  for (var i = 1; i < values.length; ++i) {
    ++res.amount;
    res.value += values[i].value;
  }
  return res;
};

function ensureDB() {
  return new Promise(function(resolve, reject) {
    if (!mongoDb)
      reject(new Error("There was an error with the DB connection"));
    else
      resolve();
  });
}

function ensureIndex() {
  return new Promise(function(resolve, reject) {
    var collection = mongoDb.collection('auction');
    collection.ensureIndex({
      auc: 1,
      ownerRealm: 1,
      timestamp: 1
    }, {
      unique: true
    }, function(err, res) {
      if (err) {
        reject(new Error(err));
        return;
      } else
        logger.log(1, 'Unique index for auction id was added : ' + res);
      collection = mongoDb.collection('items');
      //Add unique index
      collection.ensureIndex({
        id: 1
      }, {
        unique: true
      }, function(err, res) {
        if (err) {
          reject(new Error(err));
          return;
        } else
          logger.log(1, 'Unique index for item id was added : ' +
            res);

        collection = mongoDb.collection(tQueueItem);
        collection.ensureIndex({
          id: 1
        }, {
          unique: true
        }, function(err, res) {
          if (err) {
            reject(new Error(err));
            return;
          } else
            logger.log(1,
              'Unique index for item queue id was added : ' +
              res);
          resolve();
        });
      });
    });
  });
}

// Do a Map-Reduce on the auction collection
function sum(server, mapper, reducer, sort) {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var options = {
        query: {
          ownerRealm: server
        },
        out: {
          inline: 1
        }
      };
      var collection = mongoDb.collection('auction');
      logger.log(1, 'Starting map reduce');

      collection.mapReduce(mapper, reducer, options, function(err, results) {
        if (err)
          reject(new Error(err));
        else if (_.isEmpty(results))
          reject(new Error('The result was empty'));
        else {
          results.sort(sort);
          resolve(results);
        }
      });
    });
  };

  return ensureDB().then(fn);
}

dataProcess.connected = function() {
  return ensureDB();
};

dataProcess.insert = function(document, collectionName) {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection(collectionName);
      logger.log(2, 'Inserting...');

      collection.insert(document, {
        w: 1,
        keepGoing: true
      }, function(err, result) {
        //Duplicate errors
        if (err && !(err.code === 11000 || err.code === 11001)) {
          reject(err);
        } else
          resolve(document);
      });
    });
  };

  return ensureDB().then(fn);
};

dataProcess.insertDump = function(document, timestamp) {
  if (!_.isArray(document))
    document = [document];
  //Add timestamp to every elements
  document.forEach(function(item) {
    item.timestamp = timestamp;
  });
  return this.insert(document, 'auction');
};

dataProcess.close = function() {
  return ensureDB().then(function() {
    logger.log(0, 'Closing DB connection');
    mongoDb.close();
    return Promise.resolve();
  });
};

dataProcess.count = function(server) {
  var fn = function() {
    var collection = mongoDb.collection('auction');
    return collection.count({
      ownerRealm: server
    });
  };

  return ensureDB().then(fn);
};

dataProcess.getItem = function(itemID) {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection('items');
      collection.findOne({
        id: itemID
      }, function(err, item) {
        if (err)
          reject(new Error(err));
        else if (!item)
          reject(new NotFoundError());
        else
          resolve(item);
      });
    });
  };

  return ensureDB().then(fn);
};

dataProcess.containItem = function(itemID) {
  var resolve,
    reject,
    promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
  dataProcess.getItem(itemID).then(function() {
    resolve(true);
  }).catch(NotFoundError, function(e) {
    resolve(false);
  }).catch(function(e) {
    reject(e);
  });

  return promise;
};

dataProcess.insertItem = function(item) {
  return ensureDB().then(function() {
    return dataProcess.insert(item, 'items');
  });
};

dataProcess.init = function(tableName) {
  return new Promise(function(resolve, reject) {
    var url = 'mongodb://localhost:27017/' + (tableName || 'wow');
    var opt = {
      promiseLibrary: Promise
    };
    mongoClient.connect(url, opt, function(err, db) {
      logger.log(0, 'Connecting to MongoDB');
      if (err) {
        reject(new Error(err));
        return;
      }
      mongoDb = db;
      resolve();
    });
  }).then(initDB);

  //Initializes the collection if it doesn't exists
  // Creates an unique index
  function initDB() {
    return ensureIndex();
  }
};

dataProcess.getSalesOccurence = function(server) {
  return sum(server,
    function() {
      emit(this.item, 1);
    },
    reducers.normal,
    sorts.des);
};

dataProcess.getSalesValueBuyout = function(server) {
  return sum(server,
    function() {
      emit(this.item, {
        amount: 1,
        value: this.buyout
      });
    },
    reducers.double,
    sorts.double.des);
};

dataProcess.getSalesValueBid = function(server) {
  return sum(server,
    function() {
      emit(this.item, this.bid);
    },
    reducers.normal,
    sorts.asc);
};

dataProcess.getServers = function() {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection('servers');
      collection.find().toArray(function(err, servers) {
        if (err || !servers)
          reject(new Error(err));
        else
          resolve(servers);
      });
    });
  };

  return ensureDB().then(fn);
};

//Removes all servers and insert the new ones
function testServerFormat(server) {
  return server && server.hasOwnProperty('type') && server.hasOwnProperty('population') &&
   server.hasOwnProperty('status') && server.hasOwnProperty('name') && server.hasOwnProperty('slug') &&
   server.hasOwnProperty('type');
}
dataProcess.setServers = function(servers) {
  //Test format
  if(!(_.isArray(servers) && servers.every(testServerFormat)))
    return Promise.reject(new Error('The servers object had the wrong format'));
  return ensureDB().then(function() {
    return new Promise(function(resolve, reject) {
      mongoDb.collection('servers').remove(function(e) {
        if (e)
          reject(e);
        else
          resolve();
      });
    });
  }).then(function() {
      return dataProcess.insert(servers, 'servers');
  });
};

module.exports = dataProcess;
