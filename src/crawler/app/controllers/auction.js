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
    let valid = validator.validate(query, schema);
    if (!valid.valid)
      return super.done(valid.errors);

    return auction.fetchAndSaveDump(query.name, maxRetry).bind(this)
      .catch((err) => {
        return this.done(err);
      }).then(() => {
        return this.done();
      });
  }
}

module.exports = AuctionCtrl;
