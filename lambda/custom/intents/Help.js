//
// Handles help
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'AMAZON.HelpIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];

    const output = utils.readHand(event, attributes, true);
    let help;
    const helpText = res.strings.HELP_CARD_TEXT
      .replace('{0}', game.rules.minBet)
      .replace('{1}', game.rules.maxBet)
      .replace('{2}', game.rules.minBet)
      .replace('{3}', game.rules.maxBet)
      .replace('{4}', game.rules.tieBet);

    if (attributes.bot) {
      help = output.speech + helpText + ' ' + output.reprompt;
    } else {
      help = output.speech + res.strings.HELP_TEXT + output.reprompt;
    }

    return handlerInput.responseBuilder
      .speak(help)
      .reprompt(output.reprompt)
      .withSimpleCard(res.strings.HELP_CARD_TITLE, helpText)
      .getResponse();
  },
};
