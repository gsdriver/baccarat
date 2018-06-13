//
// Handles help
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    const game = this.attributes[this.attributes.currentGame];

    utils.readHand(this, true, (speech, reprompt) => {
      let help;
      const helpText = this.t('HELP_CARD_TEXT')
        .replace('{0}', game.rules.minBet)
        .replace('{1}', game.rules.maxBet)
        .replace('{2}', game.rules.minBet)
        .replace('{3}', game.rules.maxBet)
        .replace('{4}', game.rules.tieBet);

      if (this.attributes.bot) {
        help = speech + helpText + ' ' + reprompt;
      } else {
        help = speech + this.t('HELP_TEXT') + reprompt;
      }

      utils.emitResponse(this, null, null,
              help, reprompt, this.t('HELP_CARD_TITLE'), helpText);
    });
  },
};
