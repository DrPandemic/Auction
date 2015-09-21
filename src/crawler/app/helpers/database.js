"use strict";

// Const
let constants = require('../../constants'),
  initialized = false,
  mongoDb;

// Packages
let mongoClient = require('mongodb').MongoClient,
  Promise = require('bluebird'),
  logger = require('../../sLogger'),
  async = require('async');

// Errors
let DatabaseError = require('../../lib/errors').DatabaseError;

function connect(name) {
  return new Promise(function(resolve, reject) {
    var url = constants.mongoConnectionString + (name || 'wow');
    var opt = {
      promiseLibrary: Promise
    };
    mongoClient.connect(url, opt, function(err, db) {
      logger.log('db', 'Connecting to MongoDB');
      if (err) {
        reject(new DatabaseError(err));
        return;
      }
      mongoDb = db;
      resolve(mongoDb);
    });
  }).then(ensureIndex);
}

function ensureDB() {
  return new Promise(function(resolve, reject) {
    if (!initialized || !mongoDb)
      reject(new DatabaseError("There was an error with the DB connection"));
    else
      resolve(mongoDb);
  });
}

function ensureIndex() {
  return new Promise(function(resolve, reject) {
    async.each(constants.mongoIndexes, (index, cb) => {
      let collection = mongoDb.collection(index.collection);

      collection.ensureIndex(index.index, index.options, (err, res) => {
        if (err)
          cb(new DatabaseError(err));
        else {
          logger.log('db', index.message + res);
          cb();
        }
      });
    }, (err) => {
      if (err)
        reject(err);
      else
        resolve();
    });
  });
}

function insert(document, collectionName) {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection(collectionName);
      logger.log('db', 'Inserting...');

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
}

class database {
  constructor() {}

  /*
    Try to connect to MongoDB.
    @param {string} DB's name.
    @return {object} MongoDB connection.
    @error {DatabaseError}
  */
  static connect(name) {
    if (!initialized) {
      initialized = true;
      return connect(name);
    } else {
      return Promise.resolve(mongoDb);
    }
  }

  /*
    Ensure the DB is well connected.
    @return {object} MongoDB connection.
    @error {DatabaseError}
  */
  static ensureDB() {
    return ensureDB();
  }

  /*
    Get the connection object.
    Use it at your risk because it doesn't test the connection.
    @return {object} MongoDB connection.
  */
  static get connection() {
    return mongoDb;
  }

  static close() {
    return ensureDB().then(function() {
      logger.log('db', 'Closing DB connection');
      mongoDb.close();
      return Promise.resolve();
    });
  }

  static insert(document, collectionName) {
    return insert(document, collectionName);
  }
}

module.exports = database;