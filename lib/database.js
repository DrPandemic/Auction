var dataProcess = function() {
  var mongoClient = require('mongodb').MongoClient,
    logger = require('../logger'),
    self = this;
  this.logger = logger;
  this.mongoDb = null;


  mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
    logger.log(0,'Connecting to MongoDB');
    if(err) {
      console.log(err);
      return;
    }
    self.mongoDb = db;
  });
};
dataProcess.prototype.insert = function(document, callback) {
  if(!this.mongoDb) {
    callback("There was an error with the DB connection", null);
    return;
  }
  var collection = this.mongoDb.collection('auction');
  this.logger.log(1,'Inserting auction dump');
  collection.insert(document, {w:1}, callback);
};

module.exports = dataProcess;
