"use strict";
// Const
let constants = require('../../constants'),
  auctionUrl = constants.auctionUrl,
  queryEnd = constants.query;

// Packages
let logger = require('../../sLogger'),
  Promise = require('bluebird'),
  request = require('request'),
  Client = require('node-rest-client').Client,
  client = new Client(),
  _ = require('lodash');

// Validator
let Validator = require('jsonschema').Validator,
  validator = new Validator(),
  schemaQuery = require('../schemas/auction-query'),
  schemaDump = require('../schemas/auction-dump');

// Errors
let ApiError = require('../../lib/errors').ApiError,
  MaxRetryError = require('../../lib/errors').MaxRetryError,
  MalformedError = require('../../lib/errors').MalformedError;

// Database
let database = require('../helpers/database');

/*
  Query the API to get the dump.
  @param {string, string} URL to query, timestamp.
  @return {object} An object containing the result and the timestamp.
  @error {ApiError, MalformedError}
*/
function getData(source, timestamp) {
  let options = constants.defaultQueryOptions();
  options.url = source;

  logger.log('api', 'Sended request to fetch auction dump for ' + source);

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      // Logs
      logger.log('api', 'Received auction dump');

      // Errors
      logger.log('json', 'Validating...');
      if (response.statusCode !== 200 || error) {
        reject(new ApiError(error));
        return;
      } else if (!validator.validate(body, schemaDump).valid) {
        reject(new MalformedError('Dump itself'));
        return;
      }

      // Succeed
      resolve({
        timestamp: timestamp,
        results: body
      });
    });
  });
}

/*
  Query the API to get the URL of the dump and then gets the dump.
  @param {string} Realm name.
  @return {object} The dump.
  @error {ApiError, MalformedError}
*/
function query(server) {
  logger.log('api', 'Sent request to wow auction api for ' + server);
  return new Promise(function(resolve, reject) {
    client.get(auctionUrl + server + queryEnd, function(data, response) {
      // Logs
      logger.log('api', 'Received an anwser from wow api for ' + server, data);

      // Errors
      if (response.statusCode !== 200) {
        reject(new ApiError(
          'Problem with the API answer. Status code : ' + response.statusCode));
        return;
      } else if (!validator.validate(data, schemaQuery).valid) {
        reject(new MalformedError('Dump query'));
        return;
      }

      // Succeed
      getData(data.files[0].url, data.files[0].lastModified)
        .then((results) => {
          resolve(results);
        }).catch((e) => {
          reject(e);
        });
    }).on('error', (err) => {
      // This error is not tested
      reject(new ApiError(err));
    });
  });
}

/*
  Query the API to get the URL of the dump and then gets the dump.
  This will be executed a given number of tries.
  @param {string, integer} Realm name.
  @return {object} The dump.
  @error {MaxRetryError}
*/
function queryWithRetry(server, retry) {
  return query(server)
    .then(function(body) {
      logger.log('api', body.results.realms, body.results.auctions.length);
      return body;
    }).catch(function(e) {
      logger.log(['api', 'error'], e);
      if (retry > 0)
        return queryWithRetry(server, retry - 1);
      else
        throw new MaxRetryError(server);
    });
}

// DB
/*
  Save a dump in MongoDB.
  @param {object} The dump.
  @return {object} The dump.
  @error {DatabaseError}
*/
function insertDump(document, timestamp) {
  if (!_.isArray(document))
    document = [document];
  //Add timestamp to every elements
  document.forEach(function(item) {
    item.timestamp = timestamp;
  });
  return database.insert(document, constants.tableNames.auction);
}

class auction {
  constructor() {}

  /*
    Query the API for an array of auctions.
    @param {string, ?number} Realm name, number of retries.
    @return {array} An array of auctions.
    @error {ApiError}
  */
  static fetchDump(server, retry) {
    return queryWithRetry(server, retry || 0);
  }

  /*
    Fetch a dump and save it in MongoDB.
    @param {string, ?number} Realm name, number of retries.
    @return {object} The dump.
    @error {DatabaseError, ApiError}
  */
  static fetchAndSaveDump(server, retry) {
    return auction.fetchDump(server, retry)
      .then((res) => {
        return insertDump(res.results.auctions, res.timestamp);
      });
  }
}

module.exports = auction;
