"use strict";
let _ = require('lodash');
const subjects = ['api', 'db', 'error', 'json'];
let activeSubjects = [];

class logger {
  /*
    Logs event depending on the subjects.
    @param {string[], ...string} Subjects, messages.
  */
  static log(subjects) {
    if (!_.isArray(subjects))
      subjects = [subjects];

    for (let subject of subjects) {
      if (activeSubjects.indexOf(subject) > -1)
        for (var i = 1; i < arguments.length; i++)
          console.log(arguments[i]);
    }
  }
  static activate() {
    for (let subject of arguments) {
      if (activeSubjects.indexOf(subject) === -1 && subjects.indexOf(subject) > -1)
        activeSubjects.push(subject);
    }
  }
  static deactivate(subject) {
    if (subjects.indexOf(subject) > -1) {
      let index = activeSubjects.indexOf(subject);
      if (index > -1)
        activeSubjects.splice();
    }
  }
}

module.exports = logger;
