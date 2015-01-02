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
  });

  this.insert = function(document, callback) {
    if(!this.mongoDb) {
      callback("There was an error with the DB connection", null);
      return;
    }
    var collection = this.mongoDb.collection('auction');
    logger.log(1,'Inserting auction dump');
    collection.insert(document, {w:1}, callback);
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
module.exports = dataProcess;
