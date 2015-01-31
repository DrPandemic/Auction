"use strict";

var database = require('./lib/database'),
    servers = [],
    wowApi = require('./lib/wow-api'),
    logger = require('./logger'),
    wowDB = require('./lib/wow-db'),
    _ = require('underscore'),
    crawler = {};


module.exports = crawler;