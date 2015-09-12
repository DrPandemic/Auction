"use strict";

var mapReducer = {},
  mongoClient = require('mongodb').MongoClient,
  logger = require('../logger'),
  _ = require('lodash'),
  sorts = {},
  reducers = {},
  Promise = require('bluebird'),
  database = require('./database');

sorts.double = {};

sorts.asc = function(a, b) {
  return a.value - b.value;
};
sorts.double.asc = function(a, b) {
  return a.value.value - b.value.value;
};
sorts.double.des = function(b, a) {
  return a.value.value - b.value.value;
};
sorts.des = function(b, a) {
  return a.value - b.value;
};
sorts.void = function(b, a) {
  return false;
};
reducers.normal = function(key, values) {
  return Array.sum(values);
};
reducers.double = function(key, values) {
  var res = values[0];
  for (var i = 1; i < values.length; ++i) {
    ++res.amount;
    res.value += values[i].value;
  }
  return res;
};

// Do a Map-Reduce on the auction collection
function sum(server, mapper, reducer, sort) {
  var fn = function() {
    return new Promise(function(resolve, reject) {
      var options = {
        query: {
          ownerRealm: server
        },
        out: {
          inline: 1
        }
      };
      var collection = database.getConnection().collection('auction');
      logger.log(1, 'Starting map reduce');

      collection.mapReduce(mapper, reducer, options, function(err, results) {
        if (err)
          reject(new Error(err));
        else if (_.isEmpty(results))
          reject(new Error('The result was empty'));
        else {
          results.sort(sort);
          resolve(results);
        }
      });
    });
  };

  return database.connected().then(fn);
}

mapReducer.getSalesOccurence = function(server) {
  return sum(server,
    function() {
      emit(this.item, 1);
    },
    reducers.normal,
    sorts.des);
};

mapReducer.getSalesValueBuyout = function(server) {
  return sum(server,
    function() {
      emit(this.item, {
        amount: 1,
        value: this.buyout
      });
    },
    reducers.double,
    sorts.double.des);
};

mapReducer.getSalesValueBid = function(server) {
  return sum(server,
    function() {
      emit(this.item, this.bid);
    },
    reducers.normal,
    sorts.asc);
};

module.exports = mapReducer;
