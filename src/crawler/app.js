"use strict";

let Queue = require('./lib/queue'),
  queue = new Queue(),
  logger = require('./sLogger'),
  Auction = require('./app/controllers/auction'),
  auction = new Auction();

logger.activate('error', 'api', 'db', 'json');

auction.init()
  .then(() => {
    queue.listen('auction-query', function(message) {
      auction.receiveQuery(message);
    });
  });
