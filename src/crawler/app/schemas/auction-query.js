"use strict";

module.exports = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "",
  "type": "object",
  "properties": {
    "files": {
      "id": "/files",
      "type": "array",
      "minItems": 1,
      "items": {
        "id": "/files/0",
        "type": "object",
        "properties": {
          "url": {
            "id": "/files/0/url",
            "type": "string",
            "pattern": "http://[a-z]{2,}.battle.net/auction-data/[0-9a-z]+/auctions.json"
          },
          "lastModified": {
            "id": "/files/0/lastModified",
            "type": "integer"
          }
        },
        "required": [
          "url",
          "lastModified"
        ]
      },
      "required": [
        "0"
      ]
    }
  },
  "required": [
    "files"
  ]
};
