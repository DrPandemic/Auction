var DATA = require('./lib/database'),
  database = new DATA(),
  API = require('./lib/wow-api'),
  wowApi = new API(),
  logger = require('./logger');

//TODO : Add timestamp

wowApi.query('grim-batol',function(err,body) {
  if(!err && body && body.results && body.results.realm) {
    console.log(body.results.realm);
    console.log(body.results.auctions.auctions.length);
    database.insertDump(body.results.auctions.auctions, body.timestamp, function(err, results) {
      if(err)
        console.log(err);
      logger.log(0, 'Dump was inserted without error');
    });
  }
  else {
    console.log('An error occured ' + err);
    //TODO : Restart the query
  }
});
