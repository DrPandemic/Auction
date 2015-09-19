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
    console.log(validator.validate(query, schema));
    if (!validator.validate(query, schema).valid)
      return false;

    auction.fetchAndSaveDump(query.name, maxRetry)
      .catch((err) => {
        logger.log('error', err);
      }).then(() => {
        console.log(48);
      });

    return true;
  }
}

module.exports = AuctionCtrl;
