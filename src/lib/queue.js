"use strict";

var redis = require("redis");

var queue = function() {
  this.callbacks = [];
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
    self.callbacks.forEach(function(cb) {
      if(cb.channel === channel)
        cb.callback(message);
    });
  });

};

queue.prototype.subscribe = function(channel, callback) {
  this.sub.subscribe(channel);
  this.callbacks.push({channel: channel, callback: callback});
};

queue.prototype.publish = function(channel, message) {
  this.pub.publish(channel, message);
};

module.exports = queue;