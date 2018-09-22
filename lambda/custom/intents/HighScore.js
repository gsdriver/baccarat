//
// Reads the top high scores
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'HighScoreIntent'));
  },
  handle: function(handlerInput) {
    const res = require('../resources')(handlerInput);

    return new Promise((resolve, reject) => {
      utils.readLeaderBoard(handlerInput, (highScores) => {
        const speech = highScores + '. ' + res.getString('HIGHSCORE_REPROMPT');
        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(res.getString('HIGHSCORE_REPROMPT'))
          .getResponse();
        resolve(response);
      });
    });
  },
};
