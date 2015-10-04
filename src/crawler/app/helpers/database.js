"use strict";

let constants = require('../../constants'),
  initialized = false,
  mongoDb;

// Packages
let mongoClient = require('mongodb').MongoClient,
  Promise = require('bluebird'),
  logger = require('../../sLogger'),
  async = require('async');

// Errors
let DatabaseError = require('../../lib/errors').DatabaseError,
  NotFoundError = require('../../lib/errors').NotFoundError;

/*
  Try to connect to MongoDB.
  @param {string} DB's name.
  @return {object} MongoDB connection.
  @error {DatabaseError}
*/
function connect(name) {
  return new Promise(function(resolve, reject) {
    var url = constants.mongoConnectionString + (name || constants.DbName);
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

/*
  Ensure that the DB is connected.
  @return {object} MongoDB connection.
  @error {DatabaseError}
*/
function ensureDB() {
  return new Promise(function(resolve, reject) {
    if (!initialized || !mongoDb)
      reject(new DatabaseError("There was an error with the DB connection"));
    else
      resolve(mongoDb);
  });
}

/*
  Ensure that the DB is well constructed
  @error {DatabaseError}
*/
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

/*
  Insert a document in a given collection.
  @param {object, string} Object to insert, collection name.
  @return {object} The inserted document.
  @error {DatabaseError}
*/
function insert(document, collectionName) {
  return ensureDB().then(() => {
    return new Promise(function(resolve, reject) {
      var collection = mongoDb.collection(collectionName);
      logger.log('db', 'Inserting...');

      collection.insert(document, {
        w: 1,
        keepGoing: true
      }, function(err, result) {
        // Duplicate errors
        if (err && !(err.code === 11000 || err.code === 11001)) {
          reject(new DatabaseError(err));
        } else
          resolve(document);
      });
    });
  });
}

/*
  Find one document in a given collection.
  @param {object, string} Query selector, collection name.
  @return {object} The document.
  @error {DatabaseError, NotFoundError}
*/
function findOne(selector, collectionName) {
  return ensureDB().then(() => {
    return new Promise(function(resolve, reject) {
      logger.log('db', 'Finding one from ' + collectionName);
      var collection = mongoDb.collection(collectionName);
      collection.findOne(selector, function(err, result) {
        if (err)
          reject(new DatabaseError(err));
        else if (!result)
          reject(new NotFoundError("Wasn't able to find a item in " + collectionName));
        else
          resolve(result);
      });
    });
  });
}

/*
  Count the number of documents in a given collection.
  @param {object, string} Query selector, collection name.
  @return {Integer} Number of documents.
  @error {DatabaseError}
*/
function count(selector, collectionName) {
  return ensureDB().then(() => {
    var collection = mongoDb.collection(collectionName);
    return collection.count(selector);
  });
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
  //  console.log(name);
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
    Use it at your own risk because it doesn't test the connection object.
    @return {object} MongoDB connection.
  */
  static get connection() {
    return mongoDb;
  }

  static close() {
    return ensureDB().then(function() {
      logger.log('db', 'Closing DB connection');
      mongoDb.close();
      mongoDb = null;
      initialized = false;
      return Promise.resolve();
    });
  }

  /*
    Insert a document in a given collection.
    @param {object, string} Object to insert, collection name.
    @return {object} The inserted document.
    @error {DatabaseError}
  */
  static insert(document, collectionName) {
    return insert(document, collectionName);
  }

  /*
    Find one document in a given collection.
    @param {object, string} Query selector, collection name.
    @return {object} The document.
    @error {DatabaseError, NotFoundError}
  */
  static findOne(selector, collectionName) {
    return findOne(selector, collectionName);
  }

  /*
    Count the number of documents in a given collection.
    @param {object, string} Query selector, collection name.
    @return {Integer} Number of documents.
    @error {DatabaseError}
  */
  static count(selector, collectionName) {
    return count(selector, collectionName);
  }

}

module.exports = database;
