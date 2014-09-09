# Waggle
A realtime intra application communication network.

## Developing

Working with waggle is relatively easy, there is a vagrant set up in the root of the project directory so you just need to run the following and you are sorted.

** This will take approximately 5-10 minutes to complete **
```bash
vagrant up; vagrant ssh; clear; vagrant ssh;
```


## Installation

### Production Prerequisites

Running the application in a production environment requires the following managing applications

* node >0.11.13
* git
* redis-server
* [nodenv](https://github.com/OiNutter/nodenv)
* [pm2](https://github.com/Unitech/PM2)

#### Initial preparation

Git is required to get the packages and build-essential for compiling node

```bash
sudo apt-get update
sudo apt-get install git build-essential
```

#### Install nodenv

Bear in mind that when you run the install command from nodenv it will compile node from source, it is recommended that you have at least 2GB of ram and 2 CPUs assigned to the server you are building on.

```bash
# Logged in as the user for the service
git clone https://github.com/OiNutter/nodenv.git ~/.nodenv
git clone https://github.com/OiNutter/node-build.git ~/.nodenv/plugins/node-build

echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(nodenv init -)"' >> ~/.bashrc

. ~/.bashrc

type nodenv # This should return #=> "nodenv is a function"

nodenv install 0.11.13
nodenv rehash
```

#### Install pm2
```bash
nodenv exec npm install -g pm2 # This may need to be run as root (sudo)
```
pm2 start main.js --name=waggle --node-args="--harmony"
#### Install redis
```bash
sudo apt-get install redis-server
```

Ensure redis is running with ```sudo service redis-server status``` and if not then run ```sudo service redis-server start```


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
