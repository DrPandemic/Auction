var wowApi = function() {
  var Client = require('node-rest-client').Client,
  key = require('../key')(),
  logger = require('../logger'),
  auction_url = 'https://eu.api.battle.net/wow/auction/data/',
  query = '?locale=en_GB&apikey='+key,
  request = require('request'),
  url = require('url'),
  options = {
    url:'',
    gzip: true,
    method: 'GET',
    json:true
  },
  client = new Client();

  //Fetch the auction dump
  function get_data(source, timestamp, callback) {
    options.url = source;

    logger.log(1,'Sended request to fetch auction dump');

    request(options, function (error, response, body) {
      logger.log(0,'Received auction dump');
      if(response.statusCode == 200){
        callback(null,{timestamp: timestamp, results : body});
      } else {
        callback(error,body);
      }
    });
  }

  this.queryApi = function(server, callback) {
    logger.log(1,'Sent request to wow api');
    client.get(auction_url+server+query,function(data, response){
      logger.log(1,'Received an anwser from wow api');
      if(data && data.files && data.files[0])
        get_data(data.files[0].url, data.files[0].lastModified, callback);
      else
        callback('Problem with the API answer. Status code : '+response.statusCode, null);
    });
  };
};

wowApi.prototype.query = function(server, callback) {
  this.queryApi(server, callback);
};

module.exports = wowApi;
