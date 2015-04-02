'use strict';

describe('Controller: CrawlerCtrl', function () {

  // load the controller's module
  beforeEach(module('auctionApp'));

  var CrawlerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CrawlerCtrl = $controller('CrawlerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
