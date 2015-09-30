"use strict";

let database = require('../../../src/crawler/app/helpers/database');

module.exports = {
  cleanDb: () => {
    return new Promise((resolve) => {
      var db = database.connection;
      db.collection('auction').remove((e) => {
        if (e)
          console.error(e);
        db.collection('itemQueue').remove((e) => {
          if (e)
            console.error(e);
          db.collection('item').remove((e) => {
            if (e)
              console.error(e);
            db.collection('server').remove((e) => {
              if (e)
                console.error(e);
              resolve();
            });
          });
        });
      });
    });
  },
  logAll: () => {
    require('../../../src/crawler/sLogger').activateAll();
  }
};
