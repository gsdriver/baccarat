//
// Handles help
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    utils.readHand(this, true, (speech, reprompt) => {
      let output = '';
      const game = this.attributes[this.attributes.currentGame];

      if (game.bet) {
        output += this.t('READ_BET').replace('{0}', game.bet)
            .replace('{1}', utils.sayBetOn(this, game.betOn));
      }
      output += (speech + reprompt);
      utils.emitResponse(this, null, null, output, reprompt);
    });
  },
};
