var mainApp = require('../lambda/custom/index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const USERID = 'not-amazon';
const LOCALE = 'en-US';

function BuildEvent(argv)
{
  // Templates that can fill in the intent
  const bet = {'name': 'BetIntent', 'slots': {'Amount': {'name': 'Amount', 'value': ''}, 'Player': {'name': 'Player', 'value': ''}}};
  const reset = {'name': 'ResetIntent', 'slots': {}};
  const yes = {'name': 'AMAZON.YesIntent', 'slots': {}};
  const no = {'name': 'AMAZON.NoIntent', 'slots': {}};
  const help = {'name': 'AMAZON.HelpIntent', 'slots': {}};
  const stop = {'name': 'AMAZON.StopIntent', 'slots': {}};
  const cancel = {'name': 'AMAZON.CancelIntent', 'slots': {}};
  const highScore = {'name': 'HighScoreIntent', 'slots': {}};
  const martini = {'name': 'OrderMartiniIntent', 'slots': {}};
  const coffee = {'name': 'OrderCoffeeIntent', 'slots': {}};
  const repeat = {'name': 'AMAZON.RepeatIntent', 'slots': {}};
  const lambda = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": "amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19"
      },
      "attributes": {},
      "user": {
        "userId": USERID,
      },
      "new": false
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
     "context": {
       "AudioPlayer": {
         "playerActivity": "IDLE"
       },
       "Display": {},
       "System": {
         "application": {
           "applicationId": "amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19"
         },
         "user": {
           "userId": USERID,
         },
         "device": {
           "deviceId": USERID,
           "supportedInterfaces": {
             "AudioPlayer": {},
             "Display": {
               "templateVersion": "1.0",
               "markupVersion": "1.0"
             }
           }
         },
         "apiEndpoint": "https://api.amazonalexa.com",
         "apiAccessToken": "",
       }
     },
  };

  const openEvent = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": "amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19"
      },
      "attributes": {},
      "user": {
        "userId": USERID,
      },
      "new": true
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
   "context": {
     "AudioPlayer": {
       "playerActivity": "IDLE"
     },
     "Display": {},
     "System": {
       "application": {
         "applicationId": "amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19"
       },
       "user": {
         "userId": USERID,
       },
       "device": {
         "deviceId": USERID,
         "supportedInterfaces": {
           "AudioPlayer": {},
           "Display": {
             "templateVersion": "1.0",
             "markupVersion": "1.0"
           }
         }
       },
       "apiEndpoint": "https://api.amazonalexa.com",
       "apiAccessToken": "",
     }
   },
  };

  // If there is an attributes.txt file, read the attributes from there
  const fs = require('fs');
  if (fs.existsSync(attributeFile)) {
    data = fs.readFileSync(attributeFile, 'utf8');
    if (data) {
      lambda.session.attributes = JSON.parse(data);
      openEvent.session.attributes = JSON.parse(data);
    }
  }

  // If there is no argument, then we'll just return
  if (argv.length <= 2) {
    console.log('I need some parameters');
    return null;
  } else if (argv[2] == 'bet') {
    lambda.request.intent = bet;
    if (argv.length > 3) {
      bet.slots.Amount.value = (argv[3] == 'none') ? undefined : argv[3];
    }
    if (argv.length > 4) {
      bet.slots.Player.value = argv[4];
    }
  } else if (argv[2] == 'launch') {
    return openEvent;
  } else if (argv[2] == "seed") {
    if (fs.existsSync("seed.txt")) {
      data = fs.readFileSync("seed.txt", 'utf8');
      if (data) {
        return JSON.parse(data);
      }
    }
  } else if (argv[2] == 'highscore') {
    lambda.request.intent = highScore;
  } else if (argv[2] == 'help') {
    lambda.request.intent = help;
  } else if (argv[2] == 'stop') {
    lambda.request.intent = stop;
  } else if (argv[2] == 'cancel') {
    lambda.request.intent = cancel;
  } else if (argv[2] == 'reset') {
    lambda.request.intent = reset;
  } else if (argv[2] == 'repeat') {
    lambda.request.intent = repeat;
  } else if (argv[2] == 'martini') {
    lambda.request.intent = martini;
  } else if (argv[2] == 'coffee') {
    lambda.request.intent = coffee;
  } else if (argv[2] == 'yes') {
    lambda.request.intent = yes;
  } else if (argv[2] == 'no') {
    lambda.request.intent = no;
  } else {
    console.log(argv[2] + ' was not valid');
    return null;
  }

  // Write the last action
  fs.writeFile('lastaction.txt', JSON.stringify(lambda), (err) => {
    if (err) {
      console.log(err);
    }
  });

  return lambda;
}

function ssmlToText(ssml) {
  let text = ssml;

  // Replace break with ...
  text = text.replace(/<break[^>]+>/g, ' ... ');

  // Remove all other angle brackets
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

function myResponse(err, result) {
  if (err) {
    console.log('ERROR; ' + err.stack);
  } else if (!result.response || !result.response.outputSpeech) {
    console.log('GOT ' + JSON.stringify(result));
  } else {
    if (result.response.outputSpeech.ssml) {
      console.log('AS SSML: ' + result.response.outputSpeech.ssml);
      console.log('AS TEXT: ' + ssmlToText(result.response.outputSpeech.ssml));
    } else {
      console.log(result.response.outputSpeech.text);
    }
    if (result.response.card && result.response.card.content) {
      console.log('Card Content: ' + result.response.card.content);
    }
    console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
    if (result.sessionAttributes && !process.env.NOLOG) {
      console.log('"attributes": ' + JSON.stringify(result.sessionAttributes));
    }
    if (result.sessionAttributes) {
      // Output the attributes too
      const fs = require('fs');
      fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  const fs = require('fs');

  // Clear is a special case - delete this entry from the DB and delete the attributes.txt file
  dynamodb.deleteItem({TableName: 'Baccarat', Key: { id: {S: USERID}}}, function (error, data) {
    console.log("Deleted " + error);
    if (fs.existsSync(attributeFile)) {
      fs.unlinkSync(attributeFile);
    }
  });
} else {
  var event = BuildEvent(process.argv);
  if (event) {
      mainApp.handler(event, null, myResponse);
  }
}
