"use strict";

//Keep a reference to both workers
var crawler = null,
    api = null;

function startAllWorkers() {}
function startWorker(worker) {}
function stopAllWorkers() {}
function stopWorker(worker) {}

//Listen if a worker stops
//In this situation, restart it

//https://gist.github.com/dickeyxxx/0f535be1ada0ea964cae
//HUP signal sent to the master process to start restarting all the workers sequentially
process.on('SIGHUP', function() {
  console.log('restarting all workers');
});

// Kill all the workers at once
process.on('SIGTERM', stopAllWorkers);

//Launch the workers
startAllWorkers();