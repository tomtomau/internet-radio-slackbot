#!/usr/bin/env node
require('dotenv').config();
var SlackBot = require('slackbots');
var shell = require('shelljs');
var jsonfile = require('jsonfile')

// create a bot 
var bot = new SlackBot({
    token: process.env.SLACK_BOT_TOKEN, // Add a bot https://my.slack.com/services/new/bot and put the token  
    name: 'radiobot'
});

function isRunning(){
	return shell.test('-f', '/tmp/vlc.pid');
}

function play(url) {
	if (!isRunning()){
		shell.exec('./play.sh ' + url);
	}
}

function stop(){
	if (isRunning()){
		shell.exec('cat /tmp/vlc.pid | xargs kill');
	}
}

function getList() {
    var listExists = shell.test('-f', 'list.json');

    if (listExists){
        return jsonfile.readFileSync('list.json');
        return {};
    } else {
        return {};
    }
}

function setList(list) {
    jsonfile.writeFileSync('list.json', list);
}

var users = [];

bot.getUsers().then(function(body){
	users = body.members;
});

function findUserNameById(id){
	for (var i = 0; i < users.length; i++){
		if (users[i].id == id){
			return users[i].name;
		} 
	}
	return null;
}

bot.on('start', function() {
    // If you want anything to happen when it first connects, then add it here
    // But remember - if a websocket cuts out (it does happen) then the slackbot will reconnect automatically
    // thanks to forever, so use wisely
});

/**
 *  All the exciting things happen here
 */
bot.on('message', function(data) {
    if ('message' === data.type) {
        var message = data.text.toLowerCase();
        var userName = findUserNameById(data.user);
        
        if ('status' === message) {
            bot.postMessageToUser(userName, isRunning() ? 'Playing :thumbsup:' : 'Not Playing :thumbsup:' , {});	
        } else if ('stop' === message) {
            stop();
            bot.postMessageToUser(userName, 'Stopping...', {});
        } else if ('play' === message) {
            play(getList().triplej);
            bot.postMessageToUser(userName, 'Playing TripleJ', {});
        } else if ('help' === message) {
            bot.postMessageToUser(userName, 'I know commands `status`, `play`, `stop`', {});
        } else if ('list' === message) {
            var list = getList();
            bot.postMessageToUser(userName, JSON.stringify(list), {});
        } else if (message.slice(0, 3) === "add"){
            console.log("message", message);
            var args = message.split(' ');
            if (args.length < 3) {
                bot.postMessageToUser(userName, "Need three args!");
            } else {
                var list = getList();
                var key = args[1];
                var value = args[2];
                console.log(key, value);
                if ("undefined" === typeof list[key]) {
                    list[key] = value;
                }

                setList(list);
                bot.postMessageToUser(userName, JSON.stringify(list), {});
            }
        } else if (message.slice(0,6) === "remove") {
            console.log("remove", message);
            var args = message.split(' ');
            if (args.length < 2 ) {
                bot.postMessageToUser(userName, "You need two args here");
            } else {
                var key = args[1];
                var list = getList();
                if (list.hasOwnProperty(key)) {
                    delete list[key];
                    setList(list);
                    bot.postMessageToUser(userName, "Removed " + key);
                } else {
                    bot.postMessageToUser(userName, "Couldn't find key " + key);
                }
            }
        }
    }
});

bot.on('close', function(){
    // Run this inside forever, this will restart a new process
    process.exit();
});
