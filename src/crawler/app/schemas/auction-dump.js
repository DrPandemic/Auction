"use strict";

module.exports = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "",
  "type": "object",
  "properties": {
    "realms": {
      "id": "/realms",
      "type": "array",
      "minItems": 1,
      "items": [
        {
          "id": "/realms/0",
          "type": "object",
          "properties": {
            "name": {
              "id": "/realms/0/name",
              "type": "string"
            },
            "slug": {
              "id": "/realms/0/slug",
              "type": "string"
            }
          },
          "required": [
            "name",
            "slug"
          ]
        }
      ],
      "required": [
        "0",
        "1"
      ]
    },
    "auctions": {
      "id": "/auctions",
      "type": "array",
      "minItems": 1,
      "items": {
        "id": "/auctions/0",
        "type": "object",
        "properties": {
          "auc": {
            "id": "/auctions/0/auc",
            "type": "integer"
          },
          "item": {
            "id": "/auctions/0/item",
            "type": "integer"
          },
          "owner": {
            "id": "/auctions/0/owner",
            "type": "string"
          },
          "ownerRealm": {
            "id": "/auctions/0/ownerRealm",
            "type": "string"
          },
          "bid": {
            "id": "/auctions/0/bid",
            "type": "integer"
          },
          "buyout": {
            "id": "/auctions/0/buyout",
            "type": "integer"
          },
          "quantity": {
            "id": "/auctions/0/quantity",
            "type": "integer"
          },
          "timeLeft": {
            "id": "/auctions/0/timeLeft",
            "type": "string"
          },
          "rand": {
            "id": "/auctions/0/rand",
            "type": "integer"
          },
          "seed": {
            "id": "/auctions/0/seed",
            "type": "integer"
          },
          "context": {
            "id": "/auctions/0/context",
            "type": "integer"
          }
        },
        "required": [
          "auc",
          "item",
          "owner",
          "ownerRealm",
          "bid",
          "buyout",
          "quantity",
          "timeLeft",
          "rand",
          "seed",
          "context"
        ]
      }
    }
  },
  "required": [
    "realms",
    "auctions"
  ]
};
