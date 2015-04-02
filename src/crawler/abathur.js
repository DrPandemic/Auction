'use strict';

//https://gist.github.com/dickeyxxx/0f535be1ada0ea964cae
var cluster = require('cluster'),
    workers = [];

cluster.setupMaster({ exec: 'crawler.js' });

function startWorker() {
  console.log('Starting new crawler');
  workers.push(cluster.fork());
}

function stopWorker(worker) {
  worker = worker || workers.shift();
  //TODO: Check if is alive
  if(!worker)
    return;

  console.log('stopping', worker.process.pid);
  worker.send('shutdown');
  worker.disconnect();
  var killTimer = setTimeout(function() {
    worker.kill();
  }, 60000);

  worker.on('disconnect', function() {
    clearTimeout(killTimer);
  });
}

