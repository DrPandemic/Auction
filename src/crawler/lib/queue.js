"use strict";

var redis = require("redis"),
  prefix = 'channel_',
  logger = require('../sLogger'),
  listenTokens = [],
  _ = require('lodash'),
  Promise = require('bluebird'),
  RedisError = require('./errors').RedisError;


var queue = function() {
  this.callbacks_popsub = [];
  this.sub = redis.createClient();
  this.pub = redis.createClient();
  this.sub.on("error", function(err) {
    console.error("Sub Error " + err);
  });
  this.pub.on("error", function(err) {
    console.error("Pub Error " + err);
  });
  var self = this;
  this.sub.on('message', function(channel, message) {
    self.callbacks_popsub.forEach(function(cb) {
      if (cb.channel === channel)
        cb.callback(message);
    });
  });
};

queue.prototype.subscribe = function(channel, callback) {
  this.sub.subscribe(channel);
  this.callbacks_popsub.push({
    channel: channel,
    callback: callback
  });
};
queue.prototype.unsubscribe = function(channel) {
  this.sub.unsubscribe(channel);
  var i = _.findIndex(this.callbacks_popsub, function(res) {
    return res.channel === channel;
  });
  if (i >= 0)
    this.callbacks_popsub.splice(i, 1);
};

queue.prototype.publish = function(channel, message) {
  this.pub.publish(channel, message);
};

// Dnagerous
queue.prototype.listen = function(channel, callback) {
  logger.log('queue', 'Listen on ' + channel);
  var client = redis.createClient(),
    token = Symbol(),
    self = this;

  var listen = function() {
    client.blpop(prefix + channel, 0, function(err, message) {
      if (err)
        return logger.log(['queue', 'error'], err);

      //If the token is still present, execute the callback
      if (listenTokens.indexOf(token) !== -1) {
        logger.log('queue', 'Received a message on ' + channel);
        callback(JSON.parse(message[1]));

        process.nextTick(listen);
        // Or send it back in the queue
      } else
        self.pub.lpush(prefix + channel, message[1]);
    });
  };

  process.nextTick(listen);

  listenTokens.push(token);

  return token;
};
queue.prototype.send = function(channel, message) {
  logger.log('queue', 'Send on ' + channel);
  this.pub.rpush(prefix + channel, JSON.stringify(message));
};
queue.prototype.stopListen = function(token) {
  logger.log('queue', 'Stop listen');
  var index = listenTokens.indexOf(token);
  if (index > -1)
    listenTokens.splice(index, 1);
};

queue.prototype.oneListen = function(channel, cb) {
  let client = redis.createClient();
  client.blpop(prefix + channel, 0, function(err, message) {
    if (err)
      return logger.log(['queue', 'error'], err);

    logger.log('queue', 'Received a message on ' + channel);
    process.nextTick(() => {
      cb(JSON.parse(message[1]));
    });
  });
};

module.exports = queue;
