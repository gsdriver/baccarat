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
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    const game = attributes[attributes.currentGame];

    const output = utils.readHand(handlerInput, attributes, true);
    let help;
    const helpText = res.getString('HELP_CARD_TEXT')
      .replace('{0}', game.rules.minBet)
      .replace('{1}', game.rules.maxBet)
      .replace('{2}', game.rules.minBet)
      .replace('{3}', game.rules.maxBet)
      .replace('{4}', game.rules.tieBet);

    if (attributes.bot) {
      help = output.speech + helpText + ' ' + output.reprompt;
    } else {
      help = output.speech + res.getString('HELP_TEXT') + output.reprompt;
    }

    return handlerInput.responseBuilder
      .speak(help)
      .reprompt(output.reprompt)
      .withSimpleCard(res.getString('HELP_CARD_TITLE'), helpText)
      .getResponse();
  },
};
