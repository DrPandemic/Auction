'use strict';

var _ = require('lodash');
var Crawler = require('./crawler.model');

// Get list of crawlers
exports.index = function(req, res) {
  Crawler.find(function (err, crawlers) {
    if(err) { return handleError(res, err); }
    return res.json(200, crawlers);
  });
};

// Get a single crawler
exports.show = function(req, res) {
  Crawler.findById(req.params.id, function (err, crawler) {
    if(err) { return handleError(res, err); }
    if(!crawler) { return res.send(404); }
    return res.json(crawler);
  });
};

// Creates a new crawler in the DB.
exports.create = function(req, res) {
  Crawler.create(req.body, function(err, crawler) {
    if(err) { return handleError(res, err); }
    return res.json(201, crawler);
  });
};

// Updates an existing crawler in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Crawler.findById(req.params.id, function (err, crawler) {
    if (err) { return handleError(res, err); }
    if(!crawler) { return res.send(404); }
    var updated = _.merge(crawler, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, crawler);
    });
  });
};

// Deletes a crawler from the DB.
exports.destroy = function(req, res) {
  Crawler.findById(req.params.id, function (err, crawler) {
    if(err) { return handleError(res, err); }
    if(!crawler) { return res.send(404); }
    crawler.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}