var settings = function() {};

settings.prototype.verbose = 2;
settings.prototype.log = function(level, message) {
  if(level <= this.verbose)
    console.log(message);
};

module.exports = new settings();
