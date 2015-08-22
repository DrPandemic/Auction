"use strict";

var redis = require("redis"),
    prefix = 'channel_',
    logger = require('../logger'),
    listenTokens = [],
    Symbol = require('symbol');


var queue = function() {
  this.callbacks_popsub = [];
  this.sub = redis.createClient();
  this.pub = redis.createClient();
  this.sub.on("error", function (err) {
    console.log("Error " + err);
  });
  this.pub.on("error", function (err) {
    console.log("Error " + err);
  });
  var self = this;
  this.sub.on('message', function (channel, message) {
    self.callbacks_popsub.forEach(function(cb) {
      if(cb.channel === channel)
        cb.callback(message);
    });
  });
};

queue.prototype.subscribe = function(channel, callback) {
  this.sub.subscribe(channel);
  this.callbacks_popsub.push({channel: channel, callback: callback});
};

queue.prototype.publish = function(channel, message) {
  this.pub.publish(channel, message);
};

queue.prototype.listen = function(channel, callback) {
  var client = redis.createClient(),
      token = Symbol();

  var listen = function() {
    client.blpop(prefix+channel, 0, function(err, message) {
      if(err)
        return logger.log(0,err);

      //If the token is still present, execute the callback
      if(listenTokens.indexOf(token) !== -1) {
        callback(message[1]);

        process.nextTick(listen);
      } else
        this.pub.lpush(prefix+channel, message[1]);
    });
  };

  process.nextTick(listen);

  listenTokens.push(token);

  return listenTokens;
};
queue.prototype.send = function(channel, message) {
  this.pub.rpush(prefix+channel, message);
};

queue.prototype.stopListen = function(token) {
  var index = listenTokens.indexOf(token);
  if (index > -1)
    listenTokens.splice(index, 1);
};

module.exports = queue;
