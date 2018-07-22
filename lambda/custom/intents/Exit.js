//
// Handles stop, which will exit the skill
//

'use strict';

const ads = require('../ads');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.CancelIntent')
        || (request.intent.name === 'AMAZON.StopIntent')
        || (request.intent.name === 'AMAZON.NoIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (attributes.bot) {
      handlerInput.responseBuilder.speak(res.strings.EXIT_GAME.replace('{0}', ''));
    } else {
      return new Promise((resolve, reject) => {
        ads.getAd(attributes, 'baccarat', event.request.locale, (adText) => {
          handlerInput.responseBuilder
            .speak(res.strings.EXIT_GAME.replace('{0}', adText))
            .withShouldEndSession(true);
          resolve();
        });
      });
    }
  },
};
