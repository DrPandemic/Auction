var DATA = require('./lib/database'),
  database = new DATA(),
  API = require('./lib/wow-api'),
  wowApi = new API();

wowApi.query('grim-batol',function(err,body) {
  if(!err && body && body.realm) {
    console.log(body.realm);
    console.log(body.auctions.auctions.length);
  }
  else {
    console.log(err);
  }
});
