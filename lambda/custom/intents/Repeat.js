//
// Handles help
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.RepeatIntent') ||
       (request.intent.name === 'AMAZON.FallbackIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    utils.readHand(event, attributes, true, (speech, reprompt) => {
      let output = '';
      const game = attributes[attributes.currentGame];

      if (game.bet) {
        output += res.strings.READ_BET.replace('{0}', game.bet)
            .replace('{1}', utils.sayBetOn(event, game.betOn));
      }
      output += (speech + reprompt);
      handlerInput.responseBuilder
        .speak(output)
        .reprompt(reprompt);
    });
  },
};
