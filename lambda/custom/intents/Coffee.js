//
// Orders a strong cup of coffee
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'OrderCoffeeIntent'));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);

    if (!attributes.temp.martini) {
      attributes.temp.coffee = (attributes.temp.coffee + 1) || 1;
      if (!attributes.maxCoffee || (attributes.temp.coffee > attributes.maxCoffee)) {
        attributes.maxCoffee = attributes.temp.coffee;
      }
    }
    attributes.wasDrunk = undefined;

    let reprompt = (attributes.temp.reprompt
      ? attributes.temp.reprompt
      : res.getString('COFFEE_REPROMPT'));
    if (reprompt.indexOf(res.getString('COFFEE')) > -1) {
      reprompt = res.getString('COFFEE_REPROMPT');
    }
    const speech = (attributes.temp.martini
      ? res.getString('COFFEE_DRINK_SOBER')
      : res.getString('COFFEE_DRINK')) + reprompt;
    attributes.temp.martini = 0;

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
