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
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);

    const output = utils.readHand(handlerInput, attributes, true);
    let speech = '';
    const game = attributes[attributes.currentGame];

    if (game.bet) {
      speech += res.getString('READ_BET').replace('{0}', game.bet)
          .replace('{1}', utils.sayBetOn(handlerInput, game.betOn));
    }
    speech += (output.speech + output.reprompt);
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(output.reprompt)
      .getResponse();
  },
};
