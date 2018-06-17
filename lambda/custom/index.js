//
// Main handler for Alexa baccarat table skill
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('alexa-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Launch = require('./intents/Launch');
const Bet = require('./intents/Bet');
const Exit = require('./intents/Exit');
const Help = require('./intents/Help');
const Repeat = require('./intents/Repeat');
const HighScore = require('./intents/HighScore');
const Martini = require('./intents/Martini');
const Coffee = require('./intents/Coffee');
const resources = require('./resources');
const utils = require('./utils');
const request = require('request');

const APP_ID = 'amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19';

const playingHandlers = Alexa.CreateStateHandler('PLAYING', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Launch.handleIntent,
  'BetIntent': Bet.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'OrderMartiniIntent': Martini.handleIntent,
  'OrderCoffeeIntent': Coffee.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.YesIntent': Bet.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    utils.emitResponse(this, null, null, this.t('UNKNOWN_INTENT'), this.t('UNKNOWN_INTENT_REPROMPT'));
  },
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

const handlers = {
  'NewSession': function() {
    // Initialize attributes and route the request
    this.attributes.playerLocale = this.event.request.locale;
    if (!this.attributes.currentGame) {
      utils.initializeGame(this, 'basic');
    }
    if (!this.attributes.temp) {
      this.attributes.temp = {};
    }

    this.emit('LaunchRequest');
  },
  'LaunchRequest': Launch.handleIntent,
  'Unhandled': function() {
    utils.emitResponse(this, null, null, this.t('UNKNOWN_INTENT'), this.t('UNKNOWN_INTENT_REPROMPT'));
  },
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runGame);
} else {
  exports.handler = runGame;
}

function runGame(event, context, callback) {
  AWS.config.update({region: 'us-east-1'});

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    CanFulfill.check(event, (response) => {
      context.succeed(response);
    });
    return;
  }

  const alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.resources = resources.languageStrings;
  if (!event.session.sessionId || event.session['new']) {
    const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    doc.get({TableName: 'Baccarat',
            ConsistentRead: true,
            Key: {userId: event.session.user.userId}},
            (err, data) => {
      if (err || (data.Item === undefined)) {
        if (err) {
          console.log('Error reading attributes ' + err);
        } else {
          request.post({url: process.env.SERVICEURL + 'baccarat/newUser'}, (err, res, body) => {
          });
        }
      } else {
        Object.assign(event.session.attributes, data.Item.mapAttr);
      }

      execute();
    });
  } else {
    execute();
  }

  function execute() {
    alexa.registerHandlers(handlers, playingHandlers);
    alexa.execute();
  }
}

function saveState(userId, attributes) {
  const formData = {};

  formData.savedb = JSON.stringify({
    userId: userId,
    attributes: attributes,
  });

  const params = {
    url: process.env.SERVICEURL + 'baccarat/saveState',
    formData: formData,
  };

  request.post(params, (err, res, body) => {
    if (err) {
      console.log(err);
    }
  });
}
