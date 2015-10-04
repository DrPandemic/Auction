"use strict";

let database = require('../../../src/crawler/app/helpers/database'),
  collectionsToClean = ['auction', 'itemQueue', 'item', 'server', 'test'],
  async = require('async');

module.exports = {
  cleanDb: () => {
    return new Promise((resolve) => {
      let db = database.connection;
      async.eachSeries(collectionsToClean, (item, cb)=> {
        db.collection(item).remove({}, null, cb);
      }, resolve);
    });
  },
  logAll: () => {
    require('../../../src/crawler/sLogger').activateAll();
  }
};
