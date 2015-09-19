"use strict";

let key = require('./key')(),
  region = 'eu',
  base_url = 'https://' + region + '.api.battle.net/wow/';

module.exports = {
  key: key,
  auction_url: base_url + 'auction/data/',
  item_url: base_url + 'item/',
  server_url: base_url + 'realm/status',
  query: '?locale=en_GB&apikey=' + key,
  default_query_options: () => {
    return {
      url: '',
      gzip: true,
      method: 'GET',
      json: true
    };
  }
};
