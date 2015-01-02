var dataProcess = function() {
  var mongoClient = require('mongodb').MongoClient,
    logger = require('../logger'),
    mongoDb = null;
    async = require('async'),
    self = this;

  mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
    logger.log(0,'Connecting to MongoDB');
    if(err) {
      console.log(err);
      return;
    }
    self.mongoDb = db;
    self.init();
  });

  //Initializes the collection if it doesn't exists
  // Creates an unique index
  this.init = function() {
    self.mongoDb.collectionNames(function(err, colls) {
      if(err) {
        logger.log(0,'There was an error while adding the unique constraint');
        return;
      }
      var collection = self.mongoDb.collection('auction');
      collection.ensureIndex("auc",{ unique: true },function(err,res) {
        if(err)
          console.log(err);
        else
          logger.log(1,'Unique constraint for auction id was added : '+res);
      });
    });
  }

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
  }
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
module.exports = dataProcess;
