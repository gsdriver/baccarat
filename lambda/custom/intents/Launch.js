//
// Launches the skill
//

'use strict';

const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    const game = attributes[attributes.currentGame];
    let speech;

    // Either welcome or welcome back
    if (game.rounds) {
      speech = res.getString('LAUNCH_WELCOME_BACK').replace('{0}', game.bankroll);
    } else {
      speech = res.getString('LAUNCH_WELCOME');
    }

    if (attributes.wasDrunk) {
      speech += res.getString('LAUNCH_SOBER');
      attributes.wasDrunk = undefined;
    }
    attributes.temp.newGame = true;

    const reprompt = res.getString((buttons.supportButtons(handlerInput)) ? 'LAUNCH_WELCOME_BUTTON' : 'LAUNCH_REPROMPT');
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
