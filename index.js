var SlackBot = require('slackbots');
var shell = require('shelljs');
 
// create a bot 
var bot = new SlackBot({
    token: 'xoxb-18125469174-H9FLqhfrO6ywM4eBupac44Rj', // Add a bot https://my.slack.com/services/new/bot and put the token  
    name: 'radiobot'
});

function isRunning(){
	return shell.test('-f', '/tmp/vlc.pid');
}

function play() {
	if (!isRunning()){
		shell.exec('/home/pi/radio.sh');
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
    
    // define channel, where bot exist. You can adjust it there https://my.slack.com/services  
    //bot.postMessageToChannel('general', 'meow!', params);
    
    // define existing username instead of 'user_name' 
    //bot.postMessageToUser('tom', 'meow!', params); 
    
    // define private group instead of 'private_group', where bot exist 
    //bot.postMessageToGroup('private_group', 'meow!', params); 
});

bot.on('message', function(data) {
    if ('message' === data.type) {
	console.log(data.text);
	if ('status' === data.text) {
		var userName = findUserNameById(data.user);
		bot.postMessageToUser(userName, isRunning() ? 'Playing :thumbsup:' : 'Not Playing :thumbsup:' , {});	
	} else if ('stop' === data.text) {
		var userName = findUserNameById(data.user);
		stop();
		bot.postMessageToUser(userName, 'Stopping...', {});
	} else if ('play' === data.text) {
		var userName = findUserNameById(data.user);
		play();
		bot.postMessageToUser(userName, 'Playing TripleJ', {});
	} else if ('help' === data.text) {
		var userName = findUserNameById(data.user);
		bot.postMessageToUser(userName, 'I know commands `status`, `play`, `stop`', {});
	}
	
    }
    //console.log(data);
});
