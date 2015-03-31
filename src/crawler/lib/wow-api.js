"use strict";

var Client = require('node-rest-client').Client,
  key = require('../key')(),
  logger = require('../logger'),
  auction_url = 'https://eu.api.battle.net/wow/auction/data/',
  item_url = 'https://eu.api.battle.net/wow/item/',
  query = '?locale=en_GB&apikey='+key,
  request = require('request'),
  url = require('url'),
  options = {
    url:'',
    gzip: true,
    method: 'GET',
    json:true
  },
  client = new Client(),
  wowApi = {},
  Promise = require('bluebird');


//Fetch the auction dump
function getData(source, timestamp) {
  options.url = source;

  logger.log(2,'Sended request to fetch auction dump for ' + source);

  return new Promise(function(resolve, reject) {
    request(options, function (error, response, body) {
      logger.log(1,'Received auction dump');
      if(response.statusCode === 200 && !error){
        resolve({timestamp: timestamp, results : body});
      } else {
        reject(new Error(error));
      }
    });
  });
}


wowApi.query = function(server) {
  logger.log(2,'Sent request to wow auction api for ' + server);
  return new Promise(function(resolve, reject) {
    client.get(auction_url+server+query,function(data, response) {
      logger.log(1,'Received an anwser from wow api for ' + server);
      if(data && data.files && data.files[0])
        getData(data.files[0].url, data.files[0].lastModified).then(function(results) {
          resolve(results);
        });
      else
        reject(new Error('Problem with the API answer. Status code : '+response.statusCode));
    });
  });
};

wowApi.getItem = function(itemID, callback) {
  logger.log(2,'Sent request to wow item api for ' + itemID);
  return new Promise(function(resolve, reject) {
    client.get(item_url+itemID+query,function(data, response){
      logger.log(1,'Received an anwser from wow api for the item : '+itemID);
      if(data && response.statusCode === 200)
        resolve(data);
      else
        reject(new Error('Problem with the API answer. Status code : '+response.statusCode));
    });
  });
};

module.exports = wowApi;
