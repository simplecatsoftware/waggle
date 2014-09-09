#!/bin/bash
echo "Updating apt sources..."
sudo apt-get update -qq 2>&1 > /dev/null

echo "Installing requisite packages..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get install -qq git build-essential redis-server 2>&1 > /dev/null

echo "Cloning nodenv..."
git clone https://github.com/OiNutter/nodenv.git ~/.nodenv 2>&1 > /dev/null
echo "Cloning node-build..."
git clone https://github.com/OiNutter/node-build.git ~/.nodenv/plugins/node-build 2>&1 > /dev/null

echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(nodenv init -)"' >> ~/.bashrc

echo "chmod +x /vagrant/vagrant-post-login-setup.sh; /vagrant/vagrant-post-login-setup.sh" >> ~/.bashrc

echo "*** Please log into the vagrant box by running vagrant ssh to continue ***"
