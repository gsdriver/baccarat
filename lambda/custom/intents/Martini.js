//
// Orders a martini
//

'use strict';

const seedrandom = require('seedrandom');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'OrderMartiniIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    let speech = '';

    if (!attributes.temp.coffee) {
      attributes.temp.martini = (attributes.temp.martini + 1) || 1;
      if (!attributes.maxMartini || (attributes.temp.martini > attributes.maxMartini)) {
        attributes.maxMartini = attributes.temp.martini;
      }
    }

    // Shaken not stirred
    const martiniSounds = parseInt(process.env.MARTINICOUNT);
    if (!isNaN(martiniSounds) && !attributes.bot) {
      const randomValue = seedrandom(attributes.temp.martini +
          event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
      const choice = 1 + Math.floor(randomValue * martiniSounds);
      if (choice > martiniSounds) {
        choice--;
      }
      speech += `<audio src="https://s3-us-west-2.amazonaws.com/alexasoundclips/baccarat/martini${choice}.mp3"/> `;
    }

    let reprompt = (attributes.temp.reprompt
      ? attributes.temp.reprompt
      : res.strings.MARTINI_REPROMPT);
    if (reprompt.indexOf(res.strings.MARTINI) > -1) {
      reprompt = res.strings.MARTINI_REPROMPT;
    }
    speech += (attributes.temp.coffee
      ? res.strings.MARTINI_DRINK_CALM
      : res.strings.MARTINI_DRINK) + reprompt;
    attributes.temp.coffee = 0;

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
