#!/usr/bin/env node
require('dotenv').config();
var SlackBot = require('slackbots');
var shell = require('shelljs');
 
// create a bot 
var bot = new SlackBot({
    token: process.env.SLACK_BOT_TOKEN, // Add a bot https://my.slack.com/services/new/bot and put the token  
    name: 'radiobot'
});

function isRunning(){
	return shell.test('-f', '/tmp/vlc.pid');
}

function play() {
	if (!isRunning()){
		shell.exec('./play.sh http://www.abc.net.au/res/streaming/audio/mp3/triplej.pls');
	}
}

function stop(){
	if (isRunning()){
		shell.exec('cat /tmp/vlc.pid | xargs kill');
	}
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
    // more information about additional params https://api.slack.com/methods/chat.postMessage 
    var params = {
        icon_emoji: ':cat:'
    };
});

/**
 *  All the exciting things happen here
 */
bot.on('message', function(data) {
    if ('message' === data.type) {
        var message = data.text.toLowerCase();
        if ('status' === message) {
            var userName = findUserNameById(data.user);
            bot.postMessageToUser(userName, isRunning() ? 'Playing :thumbsup:' : 'Not Playing :thumbsup:' , {});	
        } else if ('stop' === message) {
            var userName = findUserNameById(data.user);
            stop();
            bot.postMessageToUser(userName, 'Stopping...', {});
        } else if ('play' === message) {
            var userName = findUserNameById(data.user);
            play();
            bot.postMessageToUser(userName, 'Playing TripleJ', {});
        } else if ('help' === message) {
            var userName = findUserNameById(data.user);
            bot.postMessageToUser(userName, 'I know commands `status`, `play`, `stop`', {});
        }
    }
});

bot.on('close', function(){
    // Run this inside forever, this will restart a new process
    process.exit();
});
