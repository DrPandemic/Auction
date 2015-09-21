"use strict";
// Deprecated

var database = require('./lib/database'),
  servers = [],
  wowApi = require('./lib/wow-api'),
  logger = require('./logger'),
  maxTry = 10,
  wowDB = require('./lib/wow-db'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  Queue = require('./lib/queue'),
  queue = new Queue(),
  connected = true,
  listenTokens = null;


wowDB.init(wowApi, database);
database.init()
 .then(start)
 .catch(catchError);

function start() {
  //TODO : Here it's simply to do something while abathur isn't completed
  queue.send('crawler', 'grim-batol');
  listenTokens = queue.listen('crawler', function(server) {
    query(server,0)
     .then(function(auctions) {
      logger.log(2, server + ' was crawling and sent back ' + auctions.length + ' auctions');
    }).catch(catchError);
  });
}

function query(server, count) {
  return wowApi.query(server)
   .then(function(body) {
    if(body && body.results && (body.results.realm || body.results.realms)) {
      logger.log(1,body.results.realms);
      logger.log(2,body.results.auctions.length);
      return database.insertDump(body.results.auctions, body.timestamp);
    }
    else {
      console.log('The body is malformed');
      if(count < maxTry)
        return query(server, count + 1);
      else
        throw new Error('Gave up trying to get data for : ' + server);
    }
  }).catch(catchError);
}

function catchError(error) {
  logger.log(0,error.message);
  logger.log(0,error.stack);
  return Promise.solve();
}

process.on('disconnect', function(msg) {
  if(msg === 'shutdown') {
    connected = false;
    queue.stopListen(listenTokens);
  }
});
