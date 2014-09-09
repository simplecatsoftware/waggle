# Waggle
A realtime intra application communication network.

## Installation

### Production Prerequisites

Running the application in a production environment requires the following managing applications

* [nodenv](https://github.com/OiNutter/nodenv)
* [pm2](https://github.com/Unitech/PM2)

#### Setup nodenv
```bash
# Logged in as the user for the service
git clone https://github.com/OiNutter/nodenv.git ~/.nodenv

echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(nodenv init -)"' >> ~/.bashrc

. ~/.bashrc

type nodenv # This should return #=> "nodenv is a function"
```

#### Setup pm2
```bash
nodenv exec npm install -g pm2 # This may need to be run as root (sudo)
```

Installation requires that you have node installed and are running at least version 0.10.31, redis is also required

```bash
brew install nvm redis
```
```bash
nvm install 0.10.31
```
```bash
sudo npm install -g nodemon
```

### Setup

```bash
git clone ssh://git@g.it.symphony.local:2222/sym/waggle.git
```

```bash
npm install
```

### Configuration

#### Configuring a service

Services are added to the application using json files in the ```config/services``` directory. They should look something like this:

```json
{
    "name": "dms",
    "resources": [
        {
            "namespace": "/document/view",
            "required": [ "fullname", "username", "extension" ],
            "unique": "username",
            "add_keys": [ "@timestamp" ]
        }
    ]
}
```

* **Name** {string}
    The name refers to the name of the application or service, all socket.io namespaces will be prefixed with this
* **Resources** {object}
    Resources refer to the categories of end points (a document, support chat, etc.)
 * **Namespace** {string}
    Is the internal namespace of the resource, socket.io-client would connect to the "/dms/document/view" namespace in this case
 * **Required** {array}
    An array of the required fields that connecting clients have to send to the server
 * **Unique** {string}
    The data item supplied by the client connection to be used
 * **Add_Keys** {array}
    An array of keys to add to the client data object
   * if prepended with a @ the value of the field will be the return value of the method named after the key

## Developing

Working with waggle is relatively easy, you just need to make sure you have the installation prerequisites installed and the following running:

* redis-server ```redis-server --loglevel=verbose```
* nodemon (from the root directory) ```nodemon```

It is also a good idea to have the following running in a terminal as it will give useful information for errors and troubleshooting.

* redis monitor ```redis-cli monitor```
