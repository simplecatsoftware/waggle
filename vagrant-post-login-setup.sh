#!/bin/bash
function userpids() {
	if [ $# == 1 ]; then
		ps -o pid= -u $1
	else
		echo "Usage: userpids <user>"
	fi
}

function ttypids() {
	if [ $# == 1 ]; then
		ps -o pid= -t $1
	else
		echo "Usage: ttypids <tty>"
	fi
}

function kick() {
	case $# in
		# if only one argument is specified, kick out the user
		1)
			# check if the user is in the system
			getent passwd $1
			if [ "$?" == "0" ]; then
				# if exists...
				TTYS=$(ps -o tty= -u $1|grep -v '?')
				kill -9 $(userpids $1)
			else
				# otherwise...
				echo "$1: No such user"
			fi
		;;
		# if two, then kill processes on the tty=$2
		2)
			TTY=$2
			# check if tty exists
			if [ -e /dev/$TTY ]; then
				kill -9 $(ttypids $TTY)
			else
				echo "$TTY: No such tty"
			fi
		;;
		# if no, then show usage
		*)
		echo "Usage: kick <user>"
		echo "       kick tty <tty> "
		;;
	esac
}

nodenv install 0.11.13
nodenv rehash

cd /vagrant
nodenv exec npm install -g pm2

pm2 start main.js --name=waggle --node-args="--harmony" --watch

sed -i '$ d' ~/.bashrc

echo "cd /vagrant" >> ~/.bashrc

echo "*** You are all set to go now, just start editing and you will be able to check your build at http://localhost:8080 ***";

kick vagrant
