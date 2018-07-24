//
// Main handler for Alexa baccarat table skill
//

'use strict';

const Alexa = require('ask-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Launch = require('./intents/Launch');
const Bet = require('./intents/Bet');
const Exit = require('./intents/Exit');
const Help = require('./intents/Help');
const Repeat = require('./intents/Repeat');
const HighScore = require('./intents/HighScore');
const Martini = require('./intents/Martini');
const Coffee = require('./intents/Coffee');
const Unhandled = require('./intents/Unhandled');
const SessionEnd = require('./intents/SessionEnd');
const utils = require('./utils');
const request = require('request');

let responseBuilder;

const requestInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const attributesManager = handlerInput.attributesManager;
      const sessionAttributes = attributesManager.getSessionAttributes();
      const event = handlerInput.requestEnvelope;

      if ((Object.keys(sessionAttributes).length === 0) ||
        ((Object.keys(sessionAttributes).length === 1)
          && sessionAttributes.bot)) {
        // No session attributes - so get the persistent ones
        attributesManager.getPersistentAttributes()
          .then((attributes) => {
            // If no persistent attributes, it's a new player
            if (!attributes.currentGame) {
              utils.initializeGame(event, attributes, 'basic');
              attributes.playerLocale = event.request.locale;
              request.post({url: process.env.SERVICEURL + 'baccarat/newUser'}, (err, res, body) => {
              });
            }

            // Since there were no session attributes, this is the first
            // round of the session - set the temp attributes
            attributes.temp = {};
            attributes.sessions = (attributes.sessions + 1) || 1;
            attributes.bot = sessionAttributes.bot;
            attributesManager.setSessionAttributes(attributes);
            responseBuilder = handlerInput.responseBuilder;
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        responseBuilder = handlerInput.responseBuilder;
        resolve();
      }
    });
  },
};

const saveResponseInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const response = handlerInput.responseBuilder.getResponse();

      if (response) {
        utils.drawTable(handlerInput, () => {
          if (response.shouldEndSession) {
            // We are meant to end the session
            SessionEnd.handle(handlerInput);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  },
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    console.log(error);
    return error.name.startsWith('AskSdk');
  },
  handle(handlerInput, error) {
    return handlerInput.responseBuilder
      .speak('An error was encountered while handling your request. Try again later')
      .getResponse();
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runGame);
} else {
  exports.handler = runGame;
}

function runGame(event, context, callback) {
  const skillBuilder = Alexa.SkillBuilders.standard();

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const skillFunction = skillBuilder.addRequestHandlers(
      Launch,
      Martini,
      Coffee,
      Bet,
      Help,
      HighScore,
      Exit,
      Repeat,
      SessionEnd,
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withTableName('Baccarat')
    .withAutoCreateTable(true)
    .withSkillId('amzn1.ask.skill.5e88f594-31a0-4d86-9a67-1aee5d717c19')
    .lambda();
  skillFunction(event, context, (err, response) => {
    if (response) {
      response.response = responseBuilder.getResponse();
    }
    callback(err, response);
  });
}
