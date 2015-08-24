"use strict";

function NotFoundError(message) {
  this.message = message;
  this.name = "NotFoundError";
  Error.captureStackTrace(this, NotFoundError);
}
// or util.inherits(MyCustomError, Error);
NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

module.exports = {NotFoundError : NotFoundError};
