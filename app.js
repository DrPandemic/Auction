var Client = require('node-rest-client').Client,
    key = require('./key').key,
    auction_url = "https://eu.api.battle.net/wow/auction/data/grim-batol?locale=en_GB&apikey=",
    http = require('http'),
    request = require('request'),
    url = require('url'),
    options = {
      port: 80,
      hostname: 'eu.battle.net',
      method: 'GET',
      path: '',
      headers:{
        "accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
        "accept-language" : "en-US,en;q=0.8",
        "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
        "accept-encoding" : "gzip,deflate",
      }
    };
var client = new Client();

client.parse_data = function(data) {
  console.log("good");
};

//Fetch the auction dump
client.get_data = function(source) {
  //Wait for one seconde
  //Auction API is not isntant
  console.log(source);
  var parts = url.parse(source);
  options.path = parts.path;
  console.log(options);

  //Query the document
  var req = http.request(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    var buffer = [];

    res.on('data', function(chunk) {
      buffer.push(new Buffer(chunk));
    });
    res.on('end', function() {
      client.parse_data(Buffer.concat(buffer).toString());
    });
  }).on('error', function(err){
    console.log("Err "+err);
  });
  req.end();
};


client.get(auction_url+key,function(data, response){
  client.get_data(data.files[0].url);
});
