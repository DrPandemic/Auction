"use strict";

var wowDB = {},
    wowApi = null,
    database = null,
    logger = require('../logger');

function ensureState(err,callback) {
  if(!wowApi && !database) {
    logger.log(0,'wow-db is not well initialized');
    err('wow-db is not well initialized', null);
    return;
  }
  else
    callback();
}

wowDB.init = function(api,db) {
  wowApi = api;
  database = db;
};
wowDB.getItem = function(itemID, callback) {
  ensureState(callback, function() {
    //Tests if the DB has it
    database.getItem(itemID,function(err, item) {
      if(err) callback(err,null);
      //Already present
      else if(item) callback(null, item);
      //If not, fetch it
      else {
        wowApi.getItem(itemID, function(err, item) {
          if(err || !item) callback(err, null);
          else {
            //Cool we have a new item, let's save it
            database.insertItem(item, function(err, res) {
              if(err) logger.log(1,'There was an error while inserting an item');
            });
           callback(null, item);
          }
        });
      }
    });
  });
};

module.exports = wowDB;
