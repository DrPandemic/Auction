'use strict';

//TODO : Test the stop procedure

var CP = require('child_process'),
    workers = [];

function startWorker() {
  console.log('Starting new crawler');
  workers.push(CP.fork('./crawler.js'));
}

function stopWorker(worker) {
  worker = worker || workers.shift();
  if(!worker || !worker.connected)
    return;

  console.log('stopping', worker.pid);
  worker.send('shutdown');
  worker.disconnect();
  var killTimer = setTimeout(function() {
    worker.kill();
  }, 60000);

  worker.on('disconnect', function() {
    clearTimeout(killTimer);
  });
}

startWorker();
