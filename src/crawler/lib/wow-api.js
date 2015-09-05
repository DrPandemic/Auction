"use strict";

var Client = require('node-rest-client').Client,
  key = require('../key')(),
  logger = require('../logger'),
  auction_url = 'https://eu.api.battle.net/wow/auction/data/',
  item_url = 'https://eu.api.battle.net/wow/item/',
  server_url = 'https://eu.api.battle.net/wow/realm/status',
  query = '?locale=en_GB&apikey=' + key,
  request = require('request'),
  url = require('url'),
  options = {
    url: '',
    gzip: true,
    method: 'GET',
    json: true
  },
  client = new Client(),
  wowApi = {},
  Promise = require('bluebird'),
  MaxRetryError = require('./errors').MaxRetryError;

//Fetch the auction dump
var getData = function(source, timestamp) {
  options.url = source;

  logger.log(2, 'Sended request to fetch auction dump for ' + source);

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      logger.log(1, 'Received auction dump');
      if (response.statusCode === 200 && !error) {
        resolve({
          timestamp: timestamp,
          results: body
        });
      } else {
        reject(new Error(error));
      }
    });
  });
};

wowApi.query = function(server) {
  logger.log(2, 'Sent request to wow auction api for ' + server);
  return new Promise(function(resolve, reject) {
    client.get(auction_url + server + query, function(data, response) {
      logger.log(1, 'Received an anwser from wow api for ' + server);
      logger.log(3, data);
      if (data && data.files && data.files[0])
        getData(data.files[0].url, data.files[0].lastModified).then(
          function(results) {
            resolve(results);
          }).catch(function(e) {
          reject(e);
        });
      else
        reject(new Error(
          'Problem with the API answer. Status code : ' + response.statusCode
        ));
    });
  });
};

wowApi.queryWithRetry = function(server, retry) {
  var self = this;
  return this.query(server)
    .then(function(body) {
      if (body && body.results && (body.results.realm || body.results.realms)) {
        logger.log(1, body.results.realms);
        logger.log(2, body.results.auctions.length);
        return body;
      } else {
        logger.log(2, 'The body is malformed');
        if (retry > 0)
          return self.queryWithRetry(server, retry - 1);
        else
          throw new Error(server);
      }
    }).catch(function(e) {
      logger.log(2, e);
      if (retry > 0)
        return self.queryWithRetry(server, retry - 1);
      else
        throw new MaxRetryError(server);
    });
};

wowApi.getItem = function(itemID) {
  logger.log(2, 'Sent request to wow item api for ' + itemID);
  return new Promise(function(resolve, reject) {
    client.get(item_url + itemID + query, function(data, response) {
      logger.log(1, 'Received an anwser from wow api for the item : ' +
        itemID);
      if (data && response.statusCode === 200)
        resolve(data);
      else
        reject(new Error(
          'Problem with the API answer. Status code : ' + response.statusCode
        ));
    });
  });
};

wowApi.getServers = function() {
  logger.log(2, 'Sent request to wow server api');
  return new Promise(function(resolve, reject) {
    client.get(server_url + query, function(data, response) {
      logger.log(1, 'Received an anwser from wow api for servers');
      if (data && response.statusCode === 200) {
        if (data.realms)
          resolve(data.realms);
        else
          reject(new Error('Received a malformed list of servers'));
      } else
        reject(new Error(
          'Problem with the API answer. Status code : ' + response.statusCode
        ));
    });
  });
};

module.exports = wowApi;
