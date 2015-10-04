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
    @param {string} Item's ID.
    @return {object} The item.
    @error {DatabaseError, NotFoundError}
  */
  static find(itemID) {
    return database.findOne({
      id: itemID
    }, constants.tableNames.item);
  }

  /*
    Fetch one item from API.
    @param {string} Item's ID.
    @return {object} The item.
    @error {DatabaseError, ApiError}
  */
  static fetch(itemID) {
    return Promise.reject();
  }

  /*
    Looks into DB to see if the item is prensent.
      If not, fetches it and saves it.
    @param {string} Item's ID.
    @return {object} The item.
    @error {DatabaseError, NotFoundError, ApiError}
  */
  static findFetchAndSave(itemID) {
    return Promise.reject();
  }
}

module.exports = item;
