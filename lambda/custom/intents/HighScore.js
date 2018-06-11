//
// Reads the top high scores
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    utils.readLeaderBoard(this, (highScores) => {
      const speech = highScores + '. ' + this.t('HIGHSCORE_REPROMPT');
      utils.emitResponse(this, null, null, speech, this.t('HIGHSCORE_REPROMPT'));
    });
  },
};
