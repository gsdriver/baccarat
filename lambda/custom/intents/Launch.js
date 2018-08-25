//
// Launches the skill
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    let speech;

    // Either welcome or welcome back
    if (game.rounds) {
      speech = res.strings.LAUNCH_WELCOME_BACK.replace('{0}', game.bankroll);
    } else {
      speech = res.strings.LAUNCH_WELCOME;
    }

    if (attributes.wasDrunk) {
      speech += res.strings.LAUNCH_SOBER;
      attributes.wasDrunk = undefined;
    }

    const reprompt = res.strings.LAUNCH_REPROMPT;
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
