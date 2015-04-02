'use strict';

angular.module('auctionApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('crawler', {
        url: '/crawler',
        templateUrl: 'app/crawler/crawler.html',
        controller: 'CrawlerCtrl'
      });
  });