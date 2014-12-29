var dataProcess = function() {
    var mongoClient = require('mongodb').MongoClient,
    mongoDb = null;

  mongoClient.connect("mongodb://localhost:27017/wow", function(err, db) {
    if(err) {
      console.log(err);
      return;
    }
    mongoDb = db;
  });


};
dataProcess.prototype.save = function(document, callback) {};

module.exports = dataProcess;
