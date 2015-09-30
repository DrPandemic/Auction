"use strict";
// Const
let constants = require('../../constants');

// Packages
let logger = require('../../sLogger'),
  Promise = require('bluebird'),
  request = require('request'),
  Client = require('node-rest-client').Client,
  client = new Client(),
  _ = require('lodash');

// Validator
let Validator = require('jsonschema').Validator,
  validator = new Validator();

// Errors
let ApiError = require('../../lib/errors').ApiError,
  MalformedError = require('../../lib/errors').MalformedError;

// Database
let database = require('../helpers/database');

class item {
  /*
    Find one item in the DB.
    @param {string, string} Item's ID.
    @return {object} The item.
    @error {DatabaseError, NotFoundError}
  */
  static get(itemID) {
    return database.findOne({
      id: itemID
    }, constants.tableNames.item);
  }
}

module.exports = item;
