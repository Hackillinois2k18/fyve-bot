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


function createHeroCard(session, url, dispUrl, sumSent, titl) {
    sumText = sumSent.join();
    return new builder.HeroCard(session)
        .title(titl)
        .text(sumText)
        .images([
            builder.CardImage.create(session, dispUrl)
        ])
        .buttons([
            builder.CardAction.openUrl(session, url, 'Go to source')
        ]);
}

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hi, I'm FyveBot. I can find and summarize data about any topic.");
        builder.Prompts.text(session, "What would you like to learn about?");
    },
    function (session, results) {
        session.dialogData.topic = results.response;
        session.send("Awesome, Ill look up information about %s", session.dialogData.topic);
        builder.Prompts.choice(session, "Would you like me to search article or video sources?", "article|video", {listStyle: 2});
    },
    function (session, results) {
        session.dialogData.format = results.response.entity;
        session.send("Great, Ill look up %ss about %s!", session.dialogData.format, session.dialogData.topic);
        session.sendTyping();

        var format = results.response.entity;
        var topic = session.dialogData.topic;

        var summaries = [];
        var url;
        if (format === "article") {
            url = 'http://127.0.0.1:5000/fyve-bot/articles/' + topic;
        } else if (format === "video") {
            url = 'http://127.0.0.1:5000/fyve-bot/videos/' + topic;
        }

        fetch(url, {method: 'GET'})
            .then(function(response){
                return response.json();
            })
            .then(function(json){
                session.sendTyping();
                for (var i = 0; i < JSON.parse(json).length; i++) {
                    articleVals = [];
                    articleVals.push(JSON.parse(json)[i].url);
                    articleVals.push(JSON.parse(json)[i].displayUrl);
                    articleVals.push(JSON.parse(json)[i].sumSentences);
                    articleVals.push(JSON.parse(json)[i].title);
                    summaries.push(articleVals)
                }
            }).then(function(res){
                session.sendTyping();
                var cards = [];
                for (var i = 0; i < summaries.length; i++) {
                    var card = createHeroCard(session, summaries[i][0], summaries[i][1], summaries[i][2], summaries[i][3]);
                    cards.push(card);
                }

                var reply = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(cards);
                session.send(reply);

            }).then(function(nextRes){
                session.send("I hope you learned something useful! Talk to you later!");
                session.endDialog();
            });
    }
]).set('storage', inMemoryStorage);