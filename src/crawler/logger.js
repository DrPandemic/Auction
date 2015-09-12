"use strict";

var settings = {};

settings.verbose = 2;
settings.log = function(level, message) {
  if(level <= this.verbose)
    console.log(message);
};

module.exports = settings;
