"use strict";

var wowDB = {},
    wowApi = null,
    database = null,
    logger = require('../logger'),
    Promise = require('bluebird');


function ensureState() {
  return new Promise(function(resolve, reject) {
    if(!wowApi || !database) {
      logger.log(0,'wow-db is not well initialized');
      reject(new Error('wow-db is not well initialized'));
    }
    else
      resolve();
  });
}

wowDB.init = function(api,db) {
  wowApi = api;
  database = db;
};
wowDB.getItem = function(itemID) {
  return ensureState()
   .then(function() {
    return database.getItem(itemID);
  }).then(function(item) {
      if(item)
        return Promise.resolve(item);
      else {
        return wowApi.getItem(itemID)
          .then(database.insertItem)
          .catch(function(err) {
            logger.log(0,error.message);
            logger.log(0,error.stack);
          });
        };
      });
};


module.exports = wowDB;
