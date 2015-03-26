"use strict";

/*
TODO :
  Finish DB transformation to promises
*/

var database = require('./lib/database'),
  servers = [],
  wowApi = require('./lib/wow-api'),
  logger = require('./logger'),
  maxTry = 10,
  wowDB = require('./lib/wow-db'),
  _ = require('underscore'),
  Promise = require('bluebird'),
  join = Promise.join;


wowDB.init(wowApi, database);
database.init().then(queryServers).catch(function(err) {
  logger.log(0, err);
});

function queryServers() {
    servers = database.getServers();

    setInterval(function callServers() {
      servers.forEach(function(server) {
        Promise.join(
          query(server.slug,0),
          database.count(server.slug),
         function(results, count) {
          logger.log(1,server.name+' has : ' + count);
          database.getSalesOccurence(server.name, function(err, results) {
            if(!err && !_.isEmpty(results))
              wowDB.getItem(results[0]._id,function(err,res) {
                if(!err) {
                  console.log('The most present item for ' + server.name + ' is : ');
                  console.log(res.name);
                } else
                  console.log('An error occured with the object most present');
              });
          });
        }).catch(function(error){
          logger.log(0,error.message);
          logger.log(0,error.stack);
        });
      });
      return callServers;
    }(),1000*60*30);
}

function query(server, count) {
  return new Promise(function(resolve, reject) {
    wowApi.query(server,function(err,body) {
      if(!err && body && body.results && body.results.realm) {
        logger.log(0,body.results.realm);
        logger.log(1,body.results.auctions.auctions.length);
        database.insertDump(body.results.auctions.auctions, body.timestamp).then(
         function(err, results) {
          //Doesn't test for errors, because it will always have some due to duplicates
          resolve(results);
        });
      }
      else {
        console.log('An error occured ' + err);
        if(count < maxTry)
          return query(server, count + 1);
        else
          reject(new Error('Gave up trying to get data for : ' + server));
      }
    });
  });
}
