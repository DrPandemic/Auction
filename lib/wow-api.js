var wowApi = function() {
  var Client = require('node-rest-client').Client,
  key = require('../key')(),
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
  function get_data(source, callback) {
    //Wait for one seconde
    //Auction API is not isntant
    options.url = source;

    request(options, function (error, response, body) {
      if(response.statusCode == 200){
        callback(null,body);
      } else {
        callback(error,body);
      }
    });
  }

  this.queryApi = function(server, callback) {
    client.get(auction_url+server+query,function(data, response){
      if(data && data.files && data.files[0])
        get_data(data.files[0].url, callback);
      else
        callback('Problem with the API answer. Status code : '+response.statusCode, null);
    });
  };
};

wowApi.prototype.query = function(server, callback) {
  this.queryApi(server, callback);
};

module.exports = wowApi;
