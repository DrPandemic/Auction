"use strict";
let _ = require('lodash');
const subjects = ['api', 'db', 'error'];
let activeSubjects = [];

class logger {
  static log(subjects, value) {
    if(!_.isArray(subjects))
      subjects = [subjects];

    for(let subject of subjects) {
      if(activeSubjects.indexOf(subject) > -1)
        console.log(value);
    }
  }
  static activate(subject) {
    if(activeSubjects.indexOf(subject) === -1 && subjects.indexOf(subject) > -1)
      activeSubjects.push(subject);
  }
  static deactivate(subject) {
    if(subjects.indexOf(subject) > -1) {
      let index = activeSubjects.indexOf(subject);
      if(index > -1)
        activeSubjects.splice();
    }
  }
}

module.exports = logger;
