# Waggle
A realtime intra application communication network.

## Installation

### Prerequisites

Installation requires that you have node installed and are running at least version 0.10.31, redis is also required

```brew install nvm redis```

```nvm install 0.10.31```

```sudo npm install -g nodemon```

### Setup

```git clone ssh://git@g.it.symphony.local:2222/sym/waggle.git```

```npm install```

## Developing

Working with waggle is relatively easy, you just need to make sure you have the installation prerequisites installed and the following running:

* redis-server ```redis-server --loglevel=verbose```
* nodemon (from the root directory) ```nodemon```

It is also a good idea to have the following running in a terminal as it will give useful information for errors and troubleshooting.

* redis monitor ```redis-cli monitor```
