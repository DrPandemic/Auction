# World of Warcraft Auction
The goal of this project is to analyse auction house trends.

## Parts
The project is made of two major parts.
### Crawler
It contains the crawler which is a node application. The goal here is to crawl
auction dump from the [Blizzard's API](https://dev.battle.net/).
In the futur, it will also calculate statistics about the acquired dumps.
### Web
It presents the data crawled. In the futur, I'll try to have graphics and
statistics about each realm.

## Run
### Crawler
To run the crawler ```npm start``` and ```npm run test``` to launch the tests.
### Web
```npm run web```

## TODO
There's many things left to do. Those lists are not exhaustives
### Crawler
- [ ] Rework the classes separation
- [x] Controllers
- [ ] CLI
- [x] Validate API responses
- [x] Have fun with node 4
- [ ] Significant statistics
- [ ] Gather data
- [ ] Work with server with multiple name (not even sure what it means)
- [ ] Better way to store auction dumps
- [ ] Continue Abathur
- [x] Improve error management with node-rest-client
- [x] Why is the logger not global...?
- [x] Logger : Use subject rather than level

### Web
- [ ] Choose which stack to use for frontend. Node rest + ng2?
- [ ] Admin account to manager everything
- [ ] Cool graphics
- [ ] Meaningful statistics to present
- [ ] Design

## Api key
I didn't put my Api keys in the project. If you want to add yours you simply need
to create ```src/crawler/key.js``` containing
```javascript
module.exports = function() {
  return 'your key';
};
```

## Participate
Don't hesitate to PR and add new issues. If you want to help me structure the project
and create something more meaningful, don't hesitate to contact me.

## License
MIT.
If you do something cool with it. Please let me know :)
