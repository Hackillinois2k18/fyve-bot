var restify = require('restify');
var builder = require('botbuilder');

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
        session.send("Yo I'm Fyve Bot.");
        builder.Prompts.text(session, "What would you like to learn about?");
    },
    function (session, results) {
        session.dialogData.topic = results.response;
        session.send("K Ill teach u about %s", session.dialogData.topic);
        session.send("Here's your learning bruh");
        session.sendTyping();
        builder.Prompts.choice(session, "Did you like the content?", "yes|no", {listStyle: 2});
    },
    function (session, results) {
        if (results.response.entity === "no") {
            session.send("Too bad");
        } else {
            session.send("K bye");
        }
        session.endDialog();
    }
]).set('storage', inMemoryStorage);