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

function isRunning() {
    return shell.test('-f', '/tmp/vlc.pid');
}

function play(url) {
    if (!isRunning()) {
        shell.exec('./play.sh ' + url);
    }
}

function stop() {
    if (isRunning()) {
        shell.exec('cat /tmp/vlc.pid | xargs kill');
    }
}

function getList() {
    var listExists = shell.test('-f', 'list.json');

    if (listExists) {
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

bot.getUsers().then(function (body) {
    users = body.members;
});

function findUserNameById(id) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].id == id) {
            return users[i].name;
        }
    }
    return null;
}

function SlargRouter(bot) {
    this.routes = [];
    this.bot = bot;
}

SlargRouter.prototype.handle = function(arguments, userName) {
    if (!arguments.length) {
        return;
    }

    var command = arguments[0];
    if (this.routes.hasOwnProperty(command) && "function" === typeof this.routes[command]) {
        this.routes[command](bot, userName, arguments);
    }
};

SlargRouter.prototype.register = function(command, callback) {
    if (this.routes.hasOwnProperty(command)) {
        throw new Error("Command " + command + " already registered");
    }

    this.routes[command] = callback;
}

var router = new SlargRouter();

router.register('status', function(bot, userName, args) {
    bot.postMessageToUser(userName, isRunning() ? 'Playing :thumbsup:' : 'Not Playing :thumbsup:', {});
});

router.register('stop', function(bot, userName, args) {
    stop();
    bot.postMessageToUser(userName, 'Stopping...', {});
});

router.register('play', function(bot, userName, args) {
    var list = getList();
    var stations = [];
    for(var k in list) stations.push(k);

    stations = stations.join(", ");

    if (args.length < 2) {
        // No station here
        bot.postMessageToUser(userName, "Try `play {station}` with one of these stations: `" + stations + "`");
    } else {
        // Check station exists
        var station = args[1];
        if (list.hasOwnProperty(station)) {
            play(list[station]);
            bot.postMessageToUser(userName, 'Playing ' + station, {});
        } else {
            bot.postMessageToUser(userName, "I don't have anything on record for `" + station + "`. Try `play {station}` with one of these stations: `" + stations + "`");

        }
    }

});

router.register('list', function(bot, userName, args) {
    var list = getList();
    console.log(list);
    bot.postMessageToUser(userName, '`'+JSON.stringify(list)+'`', {});
});

router.register('add', function(bot, userName, args) {
    if (args.length < 3) {
        bot.postMessageToUser(userName, "Need three args!");
    } else {
        var list = getList();
        var key = args[1];
        var value = args[2];
        var re = /<([^\>]+)>/;

        var sanitizedValue = value;
        if ((m = re.exec(value)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            if (null !== m[m.index+1]) {
                sanitizedValue = m[m.index+1];
            }
        }

        if ("undefined" === typeof list[key]) {
            list[key] = sanitizedValue;
        }

        setList(list);
        bot.postMessageToUser(userName, '`'+JSON.stringify(list)+'`', {});
    }
});

router.register('remove', function(bot, userName, args) {
    if (args.length < 2) {
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
});

bot.on('start', function () {
    // If you want anything to happen when it first connects, then add it here
    // But remember - if a websocket cuts out (it does happen) then the slackbot will reconnect automatically
    // thanks to forever, so use wisely
});

/**
 *  All the exciting things happen here
 */
bot.on('message', function (data) {
    if ('message' === data.type) {
        var message = data.text.toLowerCase();
        var userName = findUserNameById(data.user);

        // Naive implementation of args, but ok
        var argv = message.split(' ');

        router.handle(argv, userName);
    }
});

bot.on('close', function () {
    // Run this inside forever, this will restart a new process
    process.exit();
});
