//
// Starts the game when the user presses an Echo Button
//

'use strict';

const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Ignore if they already pressed a button
    if ((request.type === 'GameEngine.InputHandlerEvent') && attributes.temp.newGame
      && !attributes.temp.buttonId) {
      attributes.temp.buttonId = buttons.getPressedButton(request);
      if (attributes.temp.buttonId) {
        attributes.usedButton = true;
        return true;
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    const speech = res.getString('STARTGAME_START');

    // OK, set the button up for betting mode - flashing different colors
    buttons.betInputHandler(handlerInput);
    buttons.turnOffButtons(handlerInput);
    buttons.addBetAnimation(handlerInput, [attributes.temp.buttonId]);

    const reprompt = res.getString('STARTGAME_REPROMPT');
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
