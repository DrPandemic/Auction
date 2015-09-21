"use strict";

let Ctrl = require('./controller'),
  auction = require('../models/auction'),
  database = require('../helpers/database'),
  maxRetry = require('../../constants').maxRetry,
  logger = require('../../sLogger'),
  states = require('../../constants').controllerStates;

// Validator
let Validator = require('jsonschema').Validator,
  validator = new Validator(),
  schema = require('../schemas/worker-query').auction;

class AuctionCtrl extends Ctrl {
  init() {
    return super.init().bind(this).then(database.connect)
      .then(() => {
        this.state = states.ready;
      });
  }
  processQuery(query) {
    if (!validator.validate(query, schema).valid)
      return super.done();

    return auction.fetchAndSaveDump(query.name, maxRetry).bind(this)
      .catch((err) => {
        logger.log('error', err);
        this.done();
      }).then(() => {
        this.done();
      });
  }
}

module.exports = AuctionCtrl;
