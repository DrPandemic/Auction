"use strict";

var wowDB = {},
  wowApi = null,
  database = null,
  logger = require('../logger'),
  Promise = require('bluebird'),
  NotFoundError = require('./errors').NotFoundError;


function ensureState() {
  if (!wowApi || !database) {
    logger.log(0, 'wow-db is not well initialized');
    return Promise.reject(new Error('wow-db is not well initialized'));
  } else {
    return database.connected();
  }
}

wowDB.init = function(api, db) {
  wowApi = api;
  database = db;
};
wowDB.getItem = function(itemID) {
  return ensureState()
    .then(function() {
      return database.getItem(itemID);
    }).then(function(item) {
      return Promise.resolve(item);
    }).catch(NotFoundError, function() {
      return wowApi.getItem(itemID)
        .then(database.insertItem);
    });
};


module.exports = wowDB;
