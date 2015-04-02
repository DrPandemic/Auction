/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Crawler = require('./crawler.model');

exports.register = function(socket) {
  Crawler.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Crawler.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('crawler:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('crawler:remove', doc);
}