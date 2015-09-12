"use strict";

var database = require('./lib/database'),
  servers = [],
  wowApi = require('./lib/wow-api'),
  logger = require('./logger'),
  maxTry = 10,
  wowDB = require('./lib/wow-db'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  join = Promise.join;


wowDB.init(wowApi, database);
database.init().then(queryServers).catch(function(err) {
  logger.log(0, err);
});

function queryServers() {
  database.getServers()
    .then(function(res) {
      servers = res;
      setInterval(function callServers() {
        servers.forEach(function(server) {
          var auctions = null;
          query(server.slug, 0).then(function(results) {
            auctions = results;
            return database.count(server.slug);
          }).then(function(count) {
            logger.log(1, server.name + ' has : ' + count);
            return database.getSalesOccurence(server.name);
          }).then(function(sales) {
            return wowDB.getItem(sales[0]._id);
          }).then(function(item) {
            logger.log(1, 'The most present item for ' + server.name + ' is : ');
            logger.log(1, item.name);
            return Promise.resolve(item.name);
          }).catch(function(error) {
            logger.log(0, error.message);
            logger.log(0, error.stack);
          });
        });
        return callServers;
      }(), 1000 * 60 * 30);
    });
}

function query(server, count) {
  return wowApi.query(server)
    .then(function(body) {
      if (body && body.results && body.results.realm) {
        logger.log(0, body.results.realm);
        logger.log(1, body.results.auctions.auctions.length);
        return database.insertDump(body.results.auctions.auctions, body.timestamp);
      } else {
        console.log('The body is malformed');
        if (count < maxTry)
          return query(server, count + 1);
        else
          throw new Error('Gave up trying to get data for : ' + server);
      }
    }).catch(function(error) {
      logger.log(0, error.message);
      logger.log(0, error.stack);
    });
}
