"use strict";

let states = require('../../constants').controllerStates,
  Promise = require('bluebird'),
  logger = require('../../sLogger'),
  ControllerError = require('../../lib/errors').ControllerError;

class Controller {
  constructor() {
    this.state = states.busy;
    this.dying = false;
    this.forceDying = false;
    this.lastError = undefined;
  }
  init() {
    return Promise.resolve();
  }
  start() {
    return this.preStart().bind(this)
      .then(() => {
        this.state = states.ready;
      });
  }
  preStart() {
    return Promise.resolve();
  }
  stop() {
    return this.preStop().bind(this)
      .then(() => {
        this.dying = true;
        this.state = states.busy;
      }).then(this.postStop);
  }
  preStop() {
    return Promise.resolve();
  }
  postStop() {
    return Promise.resolve();
  }
  forceStop() {
    return this.stop().then(() => {
      this.forceDying = true;
    });
  }

  done(error) {
    this.lastError = error;
    logger.log('worker', 'Task done');
    if (!this.dying && !this.forceDying)
      this.state = states.ready;

    if (error) {
      logger.log('error', error);
      return Promise.reject(new ControllerError(error));
    }

    return Promise.resolve();
  }

  /*
    Give a query to this controller.
    @param {object} The query.
    @return {bool} If the query was launched.
  */
  receiveQuery(query) {
    let ok = !this.dying && this.state !== states.busy;
    this.state = states.busy;
    let promise;
    if (ok)
      promise = this.processQuery(query);

    return promise;
  }

  processQuery() {
    this.done();
    return Promise.resolve();
  }
}

module.exports = Controller;
