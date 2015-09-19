"use strict";

function NotFoundError(message) {
  this.message = message;
  this.name = "NotFoundError";
  Error.captureStackTrace(this, NotFoundError);
}
NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;

function MaxRetryError(message) {
  this.message = message;
  this.name = "MaxRetryError";
  Error.captureStackTrace(this, MaxRetryError);
}
MaxRetryError.prototype = Object.create(Error.prototype);
MaxRetryError.prototype.constructor = MaxRetryError;

function ApiError(message) {
  this.message = message;
  this.name = "ApiError";
  Error.captureStackTrace(this, ApiError);
}
ApiError.prototype = Object.create(Error.prototype);
ApiError.prototype.constructor = ApiError;

function MalformedError(message) {
  this.message = message;
  this.name = "MalformedError";
  Error.captureStackTrace(this, MalformedError);
}
MalformedError.prototype = Object.create(Error.prototype);
MalformedError.prototype.constructor = MalformedError;

function DatabaseError(message) {
  this.message = message;
  this.name = "DatabaseError";
  Error.captureStackTrace(this, DatabaseError);
}
DatabaseError.prototype = Object.create(Error.prototype);
DatabaseError.prototype.constructor = DatabaseError;

module.exports = {
  NotFoundError: NotFoundError,
  MaxRetryError: MaxRetryError,
  ApiError: ApiError,
  MalformedError: MalformedError,
  DatabaseError: DatabaseError
};
