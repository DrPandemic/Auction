"use strict";

var dataProcess = {},
  mongoClient = require('mongodb').MongoClient,
  logger = require('../logger'),
  mongoDb = null,
  async = require('async'),
  sorts = {},
  reducers = {},
  servers = [];

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

function ensureDB(err,callback) {
  if(!mongoDb) {
    logger.log(0,"There was an error with the DB connection");
    err("There was an error with the DB connection", null);
    return;
  }
  else
    callback();
}
function findItem(itemID, callback) {
  ensureDB(callback,function() {
    var collection = mongoDb.collection('items');
    collection.findOne({id:itemID},function(err, item){
      if(err)
        callback(err, null);
      else
        callback(null, item);
    });
  });
}
function ensureIndex(callback) {
  var collection = mongoDb.collection('auction');
  //Add unioque index
  collection.ensureIndex({'auc' : 1, 'ownerRealm' : 1},{ unique: true },function(err,res) {
    if(err)
      logger.log(-1,err);
    else
      logger.log(1,'Unique index for auction id was added : '+res);
    callback(err);
  });
}

function sum(server, mapper, reducer, sort, callback){
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
}

dataProcess.insert = function(document, callback) {
  if(!mongoDb) {
    callback("There was an error with the DB connection", null);
    return;
  }
  var collection = mongoDb.collection('auction');
  logger.log(1,'Inserting auction dump');
  collection.insert(document, {continueOnError: true, safe: true, w:1}, callback);
};


dataProcess.insertDump = function(document, timestamp, callback) {
  //Add timestamp to every elements
  async.each(document, function(item, cb) {
    item.timestamp = timestamp;
    cb();
  },function(err){
    if(err) {
      logger.log(0,'There was an error while adding timestamps ' + err);
      return;
    }
    dataProcess.insert(document,callback);
  });
};

dataProcess.close = function() {
  if(!mongoDb) {
    logger.log(0,'There was an error with the DB connection while trying to close the connection');
    return;
  }
  logger.log(0,'Closing DB connection');
  mongoDb.close();
};

dataProcess.count = function(server, callback) {
  if(!mongoDb) {
    callback("There was an error with the DB connection", null);
    return;
  }
  var collection = mongoDb.collection('auction');
  collection.count(callback);
};

dataProcess.containItem = function(itemID, callback) {
  findItem(itemID, function(err, res) {
    if(err)
      callback(err, null);
    else
      callback(null, res ? true : false);
  });
};

dataProcess.init = function(callback) {
  mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
    logger.log(0,'Connecting to MongoDB');
    if(err) {
      console.log(err);
      callback(err);
      return;
    }
    mongoDb = db;
    initDB(callback);
  });

  //Initializes the collection if it doesn't exists
  // Creates an unique index
  function initDB(callback) {
    var collection = mongoDb.collection('servers');
    collection.find().toArray(function(err, items) {
      if(err) {
        logger.log(-1, 'There was an error while getting the server list');
        callback(err);
        return;
      }
      logger.log(1,items);
      servers = items;
      ensureIndex(callback);
    });
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
