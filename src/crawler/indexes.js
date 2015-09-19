"use strict";

module.exports = [
  {
    collection: 'auction',
    message: 'Unique index for auction id was added : ',
    index: {
      auc: 1,
      ownerRealm: 1,
      timestamp: 1
    },
    options: {
      unique: true
    }
  },
  {
    collection: 'item',
    message: 'Unique index for item id was added : ',
    index: {
      id: 1
    },
    options: {
      unique: true
    }
  },
  {
    collection: 'itemQueue',
    message: 'Unique index for item queue id was added : ',
    index: {
      id: 1
    },
    options: {
      unique: true
    }
  },
  {
    collection: 'server',
    message: 'Unique index for servers id was added : ',
    index: {
      slug: 1
    },
    options: {
      unique: true
    }
  }
];
