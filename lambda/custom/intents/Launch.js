//
// Launches the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // Simple - welcome them to the game and have them bet
    let speech;
    const game = this.attributes[this.attributes.currentGame];

    // Either welcome or welcome back
    if (game.rounds) {
      speech = this.t('LAUNCH_WELCOME_BACK').replace('{0}', game.bankroll);
    } else {
      speech = this.t('LAUNCH_WELCOME');
    }

    this.handler.state = 'PLAYING';
    const reprompt = this.t('LAUNCH_REPROMPT');
    speech += reprompt;
    utils.emitResponse(this, null, null, speech, reprompt);
  },
};
