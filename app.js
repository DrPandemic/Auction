var API = require('./lib/wow-api'),
  wowApi = new API();

wowApi.query('grim-batol',function(err,body) {
  if(!err && body) {
    console.log(body.realm);
  }
  else {
    console.log(err);
  }
});
