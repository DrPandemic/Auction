var DATA = require('./lib/database'),
  database = new DATA(),
  API = require('./lib/wow-api'),
  wowApi = new API(),
  logger = require('./logger');

wowApi.query('grim-batol',function(err,body) {
  if(!err && body && body.results && body.results.realm) {
    console.log(body.results.realm);
    console.log(body.results.auctions.auctions.length);
    database.insertDump(body.results.auctions.auctions, body.timestamp, function(err, results) {
      //Doesn't test for error, because it will always have errors due to duplicate
      logger.log(0, 'Dump was inserted');
      database.close();
    });
  }
  else {
    console.log('An error occured ' + err);
    //TODO : Restart the query
  }
});
