var restify = require('restify');
var builder = require('botbuilder');
const fetch = require('node-fetch');

// Setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log("%s listening to %s", server.name, server.url);
});

// Chat connector for communication with Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hi, I'm FyveBot. I can find and summarize data about any topic.");
        builder.Prompts.text(session, "What would you like to learn about?");
    },
    function (session, results) {
        session.dialogData.topic = results.response;
        session.send("Awesome, Ill look up information about %s", session.dialogData.topic);
        builder.Prompts.choice(session, "Would you like me to search text or video sources?", "text|video", {listStyle: 2});
    },
    function (session, results) {
        session.dialogData.format = results.response.entity;
        session.send("Great, Ill look up %s about %s", session.dialogData.format, session.dialogData.topic);
        session.sendTyping();

        var format = results.response.entity;
        var topic = session.dialogData.topic
        if (format === "text") {
            var url = 'http://127.0.0.1:5000/fyve-bot/articles/' + topic;
            fetch(url)
                .then(response => {
                    response.json().then(json => {
                        console.log(
                            `url: ${json[0].url}`
                        );
                    });
                })
            .catch(error => {
                console.log(error);
            });

            // fetch('http://127.0.0.1:5000/fyve-bot/articles/', { 
            //     method: 'GET',
            //     body:    session.dialogData.topic,
            //     headers: { 'Content-Type': 'application/json' },
            // })
            //     .then(res => res.json())
            //     .then(json => console.log(json));

        } else {
            var url = 'http://127.0.0.1:5000/fyve-bot/videos/' + topic;
            fetch(url)
                .then(response => {
                    response.json().then(json => {
                        console.log(
                            `url: ${json[0].url}`
                        );
                    });
                })
            .catch(error => {
                console.log(error);
            });

            // fetch('http://127.0.0.1:5000/fyve-bot/videos/', { 
            //     method: 'GET',
            //     body:    session.dialogData.topic,
            //     headers: { 'Content-Type': 'application/json' },
            // })
            //     .then(res => res.json())
            //     .then(json => console.log(json));

        }
        session.send("I hope that was useful. Bye!");
        session.endDialog();
    }
]).set('storage', inMemoryStorage);