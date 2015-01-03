var dataProcess = function(servers, callback) {
  var mongoClient = require('mongodb').MongoClient,
    logger = require('../logger'),
    mongoDb = null;
    async = require('async'),
    self = this;

  mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
    logger.log(0,'Connecting to MongoDB');
    if(err) {
      console.log(err);
      callback(err);
      return;
    }
    self.mongoDb = db;
    self.init(callback);
  });

  this.sorts = {};
  this.sorts.double = {};
  this.reducers = {};
  this.sorts.asc = function(a,b) {
    return a.value - b.value;
  };
  this.sorts.double.asc = function(a,b) {
    return a.value.value - b.value.value;
  };
  this.sorts.des = function(b,a) {
    return a.value - b.value;
  };
  this.sorts.void = function(b,a) {
    return false;
  };
  this.reducers.normal = function(key, values) {
    return Array.sum(values);
  };
  this.reducers.double = function(key, values) {
    var res = values[0];
    for (var i = 1; i < values.length; ++i) {
      ++res.amount;
      res.value += values[i].value;
    }
    return res;
  };

  //Initializes the collection if it doesn't exists
  // Creates an unique index
  this.init = function() {
    self.mongoDb.collectionNames(function(err, colls) {
      if(err) {
        logger.log(0,'There was an error while adding the unique constraint');
        callback(err);
        return;
      }
      var collection = self.mongoDb.collection('auction');
      servers.forEach(function(server) {
        collection.ensureIndex({'auc' : 1, 'ownerRealm' : 1},{ unique: true },function(err,res) {
          if(err)
            console.log(err);
          else
            logger.log(1,'Unique index for auction id was added : '+res);
          callback(err);
        });
      });
    });
  };

  this.insert = function(document, callback) {
    if(!this.mongoDb) {
      callback("There was an error with the DB connection", null);
      return;
    }
    var collection = this.mongoDb.collection('auction');
    logger.log(1,'Inserting auction dump');
    collection.insert(document, {continueOnError: true, safe: true, w:1}, callback);
  };

  this.insertDump = function(document, timestamp, callback) {
    //Add timestamp to every elements
    self = this;
    async.each(document, function(item, cb) {
      item.timestamp = timestamp;
      cb();
    },function(err){
      if(err) {
        self.logger.log(0,'There was an error while adding timestamps ' + err);
        return;
      }
      self.insert(document,callback);
    });
  };

  this.close = function() {
    if(!this.mongoDb) {
      logger.log(0,'There was an error with the DB connection while trying to close the connection');
      return;
    }
    logger.log(0,'Closing DB connection');
    this.mongoDb.close();
  };

  this.count = function(server, callback) {
    if(!this.mongoDb) {
      callback("There was an error with the DB connection", null);
      return;
    }
    var collection = this.mongoDb.collection('auction');
    collection.count(callback);
  };

  this.sum = function(server, mapper, reducer, sort, callback){
    var options = {
      query: {ownerRealm:server},
      out: {inline:1}
    };
    var collection = this.mongoDb.collection('auction');
    logger.log(1,'Starting map reduce');

    collection.mapReduce(mapper, reducer, options, function(err, results) {
      if(!err) {
        results.sort(sort);
        callback(err,results);
      } else
        callback(err,results);
    });
  };
};
dataProcess.prototype.insert = function(document, callback) {
  this.insert(document,callback);
};
dataProcess.prototype.insertDump = function(document, timestamp, callback) {
  this.insertDump(document, timestamp, callback);
};
dataProcess.prototype.close = function() {
  this.close();
};
dataProcess.prototype.count = function(server, callback) {
  this.count(server, callback);
};
dataProcess.prototype.getSalesOccurence = function(server, callback) {
  this.sum(server,
    function(){
      emit(this.item,1);
    },
    this.reducers.normal,
    this.sorts.asc,
    callback);
};
dataProcess.prototype.getSalesValueBuyout = function(server, callback) {
  this.sum(server,
    function(){
      emit(this.item,{amount : 1 , value : this.buyout});
    },
    this.reducers.double,
    this.sorts.double.asc,
    callback);
};
dataProcess.prototype.getSalesValueBid = function(server, callback) {
  this.sum(server,
    function(){
      emit(this.item,this.bid);
    },
    this.reducers.normal,
    this.sorts.asc,
    callback);
};

module.exports = dataProcess;
