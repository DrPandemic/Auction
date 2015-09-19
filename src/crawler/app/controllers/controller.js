"use strict";

let states = require('../../constants').controllerStates,
  Promise = require('bluebird');

class Controller {
  constructor() {
    this.state = states.busy;
    this.dying = false;
    this.forceDying = false;
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
      });
  }
  preStop() {
    return Promise.resolve();
  }
  forceStop() {
    return this.stop().then(() => {
      this.forceDying = true;
    });
  }

  /*
    Give a query to this controller.
    @param {object} The query.
    @return {bool} If the query was launched.
  */
  receiveQuery(query) {
    let ok = !this.dying && this.state !== states.busy;
    this.state = states.busy;
    if (ok)
      ok = this.processQuery(query);

    return ok;
  }

  processQuery() {}
}

module.exports = Controller;
