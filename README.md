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
- [ ] Significant statistics
- [ ] Gather data
- [ ] Rework the classes separation
- [ ] Work with server with multiple name (not even sure what it means)
- [ ] Better way to store auction dumps
- [ ] Continue Abathur
- [ ] Improve error management with node-rest-client
- [ ] Why is the logger not global...?

### Web
- [ ] Admin account to manager everything
- [ ] Cool graphics
- [ ] Meaningful statistics to present
- [ ] Design

## Participate
Don't hesitate to PR and add new issues. If you want to help me structure the project
and create something more meaningful, don't hesitate to contact me.

## License
MIT.
If you do something cool with it. Please let me know :)
