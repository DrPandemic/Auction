"use strict";

var rewire = require("rewire"),
  should = require('should'),
  sinon = require('sinon'),
  async = require('async'),
  _ = require('underscore'),
  database = null,
  connErr = null;

