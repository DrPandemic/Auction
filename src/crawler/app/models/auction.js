"use strict";
let logger = require('../../sLogger'),
  constants = require('../../constants'),
  auction_url = constants.auction_url,
  Promise = require('bluebird'),
  request = require('request'),
  ApiError = require('../../lib/errors').ApiError,
  Client = require('node-rest-client').Client,
  client = new Client(),
  query_end = constants.query;

/*
  Query the API to get the dump.
  @param {string, string} URL to query, timestamp.
  @return {object} An object containing the result and the timestamp.
  @error {ApiError}
*/
function getData(source, timestamp) {
  let options = constants.default_query_options();
  options.url = source;

  logger.log('api', 'Sended request to fetch auction dump for ' + source);

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      logger.log('api', 'Received auction dump');
      //TODO
      if (response.statusCode === 200 && !error) {
        resolve({
          timestamp: timestamp,
          results: body
        });
      } else {
        reject(new ApiError(error));
      }
    });
  });
}

/*
  Query the API to get the URL of the dump and then gets the dump.
  @param {string} Realm name.
  @return {object} The dump.
  @error {ApiError}
*/
function query(server) {
  logger.log('api', 'Sent request to wow auction api for ' + server);
  return new Promise(function(resolve, reject) {
    client.get(auction_url + server + query_end, function(data, response) {
      logger.log('api', 'Received an anwser from wow api for ' + server);
      logger.log('api', data);

      //TODO
      if (!data && data.files && data.files[0]) {
        reject(new ApiError(
          'Problem with the API answer. Status code : ' + response.statusCode
        ));
        return;
      }

      console.log(data.files[0]);

      getData(data.files[0].url, data.files[0].lastModified).then(
        (results) => {
          resolve(results);
        }).catch((e) => {
        reject(e);
      });
    });
  });
}
/*
wowApi.queryWithRetry = function(server, retry) {
  var self = this;
  return this.query(server)
    .then(function(body) {
      if (body && body.results && (body.results.realm || body.results.realms)) {
        logger.log(1, body.results.realms);
        logger.log(2, body.results.auctions.length);
        return body;
      } else {
        logger.log(2, 'The body is malformed');
        if (retry > 0)
          return self.queryWithRetry(server, retry - 1);
        else
          throw new Error(server);
      }
    }).catch(function(e) {
      logger.log(2, e);
      if (retry > 0)
        return self.queryWithRetry(server, retry - 1);
      else
        throw new MaxRetryError(server);
    });
};*/

class auction {
  constructor() {

  }

  /*
    Query the API for an array of auctions.
    @param {string, !number} Realm name, number of retries.
    @return {array} An array of auctions.
  */
  static fetch(server, retry) {
    return query(server);
  }
}

module.exports = auction;
