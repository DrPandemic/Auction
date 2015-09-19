"use strict";

let key = require('./key')(),
  region = 'eu',
  baseUrl = 'https://' + region + '.api.battle.net/wow/';

module.exports = {
  key: key,
  auctionUrl: baseUrl + 'auction/data/',
  itemUrl: baseUrl + 'item/',
  serverUrl: baseUrl + 'realm/status',
  query: '?locale=en_GB&apikey=' + key,
  defaultQueryOptions: () => {
    return {
      url: '',
      gzip: true,
      method: 'GET',
      json: true
    };
  },
  mongoConnectionString: 'mongodb://localhost:27017/',
  mongoIndexes: require('./indexes'),
  tableNames: {
    auction: 'auction'
  },
  controllerStates: {
    ready: 'ready',
    busy: 'busy'
  },
  maxRetry: 5
};
