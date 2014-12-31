var DATA = require('./lib/database'),
  database = new DATA(),
  API = require('./lib/wow-api'),
  wowApi = new API(),
  logger = require('./logger');

//TODO : Add timestamp

wowApi.query('grim-batol',function(err,body) {
  if(!err && body && body.realm) {
    console.log(body.realm);
    console.log(body.auctions.auctions.length);
    database.insert(body.auctions.auctions, function(err, results) {
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
