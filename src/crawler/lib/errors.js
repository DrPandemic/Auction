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

module.exports = {
  NotFoundError: NotFoundError,
  MaxRetryError: MaxRetryError,
  ApiError: ApiError
};
