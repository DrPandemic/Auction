'use strict';

var config = browser.params;

describe('Main View', function() {
  var page;

  beforeEach(function() {
    browser.get(config.baseUrl + '/');
    page = require('./main.po');
  });

  it('should include jumbotron with correct data', function() {
    page.h1El.getText().should.eventually.equal('\'Allo, \'Allo!');
    page.imgEl.getAttribute('src').should.eventually.match(/yeoman.png$/);
    page.imgEl.getAttribute('alt').should.eventually.equal('I\'m Yeoman');
  });
});
