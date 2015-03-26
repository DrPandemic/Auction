"use strict";

var dataProcess = {},
    mongoClient = require('mongodb').MongoClient,
    logger = require('../logger'),
    mongoDb = null,
    async = require('async'),
    _ = require('underscore'),
    sorts = {},
    reducers = {},
    servers = [],
    tQueueItem = 'itemQueue',
    Promise = require('bluebird');



  sorts.double = {};


sorts.asc = function(a,b) {
  return a.value - b.value;
};
sorts.double.asc = function(a,b) {
  return a.value.value - b.value.value;
};
sorts.double.des = function(b,a) {
  return a.value.value - b.value.value;
};
sorts.des = function(b,a) {
  return a.value - b.value;
};
sorts.void = function(b,a) {
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
    if(!mongoDb)
      reject(new Error("There was an error with the DB connection"));
    else
      resolve();
  });
}

function ensureIndex() {
  return new Promise(function(resolve, reject) {
    var collection = mongoDb.collection('auction');
    collection.ensureIndex({auc : 1, ownerRealm : 1, timestamp : 1},{ unique: true }, function(err,res) {
      if(err) {
        reject(new Error(err));
        return;
      }
      else
        logger.log(1,'Unique index for auction id was added : '+res);
      collection = mongoDb.collection('items');
      //Add unique index
      collection.ensureIndex({id : 1},{ unique: true }, function(err,res) {
        if(err) {
          reject(new Error(err));
          return;
        }
        else
          logger.log(1,'Unique index for item id was added : '+res);

        collection = mongoDb.collection(tQueueItem);
        collection.ensureIndex({id : 1},{ unique: true }, function(err,res) {
          if(err) {
            reject(new Error(err));
            return;
          }
          else
            logger.log(1,'Unique index for item queue id was added : '+res);
          resolve();
        });
      });
    });
  });
}

function sum(server, mapper, reducer, sort, callback){
  ensureDB(callback,function() {
    var options = {
      query: {ownerRealm:server},
      out: {inline:1}
    };
    var collection = mongoDb.collection('auction');
    logger.log(1,'Starting map reduce');

    collection.mapReduce(mapper, reducer, options, function(err, results) {
      if(!err) {
        results.sort(sort);
        callback(err,results);
      } else
        callback(err,results);
    });
  });
}

dataProcess.insert = function(document, collectionName) {
  return ensureDB().then(new Promise(function(resolve, reject) {
    var collection = mongoDb.collection(collectionName);
    logger.log(1,'Inserting...');
    collection.insert(document, {continueOnError: true, safe: true, w:1}, function(err, result) {
      //We ignore error, because duplicates will trigger errors
      resolve();
    });
  }));
};

dataProcess.insertDump = function(document, timestamp) {
  var self = this;
  return ensureDB().then(new Promise(function(resolve, reject) {
    if(!_.isArray(document))
      document = [document];
    //Add timestamp to every elements
    document.forEach(function(item) {
      item.timestamp = timestamp;
    });
    return self.insert(document, 'auction');
  }));
};

dataProcess.pushItemQueue = function(item, callback) {
};
dataProcess.popItemQueue = function(item, callback) {
};

dataProcess.close = function() {
  ensureDB().then(function() {
    logger.log(0,'Closing DB connection');
    mongoDb.close();
    return Promise.resolve();
  });
};

dataProcess.count = function(server) {
  return ensureDB().then(new Promise(function(resolve, reject) {
    var collection = mongoDb.collection('auction');
    collection.count(function(err,results) {
      if(err)
        reject(err);
      else
        resolve(results);
    });
  }));
};

dataProcess.getItem = function(itemID, callback) {
  ensureDB(callback,function() {
    var collection = mongoDb.collection('items');
    collection.findOne({id:itemID},function(err, item){
      if(err || !item)
        callback(err, null);
      else
        callback(null, item);
    });
  });
};

dataProcess.containItem = function(itemID, callback) {
  dataProcess.getItem(itemID, function(err, res) {
    if(err)
      callback(err, null);
    else
      callback(null, res ? true : false);
  });
};

dataProcess.insertItem = function(item, callback) {
  ensureDB(callback,function() {
    dataProcess.insert(item, 'items', callback);
  });
};

dataProcess.init = function() {
  return new Promise(function(resolve, reject) {
    mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
      logger.log(0,'Connecting to MongoDB');
      if(err) {
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
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection('servers');
      collection.find().toArray(function(err, items) {
        if(err) {
          reject(new Error('There was an error while getting the server list'));
          return;
        }
        logger.log(2,items);
        servers = items;
        resolve();
      });
    }).then(ensureIndex);
  }
};

dataProcess.connected = function(callback) {
  ensureDB(function() {
    callback(false);
  },function() {
    callback(true);
  });
};

dataProcess.getSalesOccurence = function(server, callback) {
  sum(server,
    function(){
      emit(this.item,1);
    },
    reducers.normal,
    sorts.des,
    callback);
};

dataProcess.getSalesValueBuyout = function(server, callback) {
  sum(server,
    function(){
      emit(this.item,{amount : 1 , value : this.buyout});
    },
    reducers.double,
    sorts.double.des,
    callback);
};

dataProcess.getSalesValueBid = function(server, callback) {
  sum(server,
    function(){
      emit(this.item,this.bid);
    },
    reducers.normal,
    sorts.asc,
    callback);
};

dataProcess.getServers = function(){
  return servers;
};

module.exports = dataProcess;
