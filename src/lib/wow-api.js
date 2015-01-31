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
  wowApi = {};

//Fetch the auction dump
function get_data(source, timestamp, callback) {
  options.url = source;

  logger.log(1,'Sended request to fetch auction dump for ' + source);

  request(options, function (error, response, body) {
    logger.log(0,'Received auction dump');
    if(response.statusCode == 200 && !error){
      callback(null,{timestamp: timestamp, results : body});
    } else {
      callback(error,body);
    }
  });
}


wowApi.queryApi = function(server, callback) {
  logger.log(1,'Sent request to wow auction api for ' + server);
  client.get(auction_url+server+query,function(data, response){
    logger.log(1,'Received an anwser from wow api');
    if(data && data.files && data.files[0])
      get_data(data.files[0].url, data.files[0].lastModified, callback);
    else
      callback('Problem with the API answer. Status code : '+response.statusCode, null);
  });
};

wowApi.getItem = function(itemID, callback) {
  logger.log(1,'Sent request to wow item api for ' + itemID);
  client.get(item_url+itemID+query,function(data, response){
    logger.log(1,'Received an anwser from wow api for the item : '+itemID);
    if(data && response.statusCode === 200)
      callback(null, data);
    else
      callback('Problem with the API answer. Status code : '+response.statusCode, null);
  });
};

wowApi.query = function(server, callback) {
  this.queryApi(server, callback);
};

module.exports = wowApi;
