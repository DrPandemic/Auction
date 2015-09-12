"use strict";

var wowDB = {},
  wowApi = null,
  database = null,
  logger = require('../logger'),
  Promise = require('bluebird'),
  NotFoundError = require('./errors').NotFoundError;

function ensureState() {
  return new Promise(function(resolve, reject) {
    if (!wowApi || !database) {
      logger.log(0, 'wow-db is not well initialized');
      reject(new Error('wow-db is not well initialized'));
    } else {
      database.connected()
        .then(resolve)
        .catch(reject);
    }
  });
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
      return wowApi.getItem(itemID);
    }).then(function(res) {
      return database.insertItem(res);
    });
};

wowDB.getServers = function() {
  return ensureState()
    .then(function() {
      return wowApi.getServers();
    }).then(function(servers) {
      return database.setServers(servers);
    });
};


module.exports = wowDB;
