"use strict";

var database = require('./lib/database'),
    servers = [],
    wowApi = require('./lib/wow-api'),
    logger = require('./logger'),
    wowDB = require('./lib/wow-db'),
    async = require('async'),
    crawler = {},
    maxTry = 5,
    timing = 1000*60*30;

init();

function init() {
  database.init(function(err) {
    if(err) {
      logger.log(1,err);
      return;
    }
    queryServers();
  });
}
function queryServers() {
  servers = database.getServers();
  async.each(servers, function(server, cb) {
    queryServer(server.slug,0,function(err) {
      cb();
    });
  }, function(err) {
    setTimeout(queryServers, timing);
  });
}
function queryServer(server, count, callback) {
  wowApi.query(server,function(err,body) {
    if(!err && body && body.results && body.results.realm) {
      database.insertDump(body.results.auctions.auctions, body.timestamp, function(err, results) {
        //Doesn't test for errors, because it will always have some due to duplicates
        logger.log(1,server + " was updated");
        callback(err, results);
      });
    }
    else {
      if(count < maxTry)
        queryServer(server, count + 1, callback);
      else {
        var error = 'Gave up trying to get data for : ' + server;
        logger.log(1, error);
        callback(error, null);
      }
    }
  });
}

module.exports = crawler;