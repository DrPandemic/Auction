"use strict";

let Queue = require('./lib/queue'),
  queue = new Queue(),
  logger = require('./sLogger'),
  Auction = require('./app/controllers/auction'),
  auction = new Auction();

logger.activateAll();

function listen(message) {
  auction.receiveQuery(message)
    .finally(() => {
      queue.oneListen('auction-query', listen);
    });
}

auction.init()
  .then(() => {
    queue.oneListen('auction-query', listen);
  });
