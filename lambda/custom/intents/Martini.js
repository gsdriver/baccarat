//
// Orders a martini
//

'use strict';

const utils = require('../utils');
const seedrandom = require('seedrandom');

module.exports = {
  handleIntent: function() {
    const game = this.attributes[this.attributes.currentGame];
    let speech = '';
    if (!this.attributes.temp.coffee) {
      this.attributes.temp.martini = (this.attributes.temp.martini + 1) || 1;
      this.attributes.wasDrunk = true;
      if (!this.attributes.maxMartini
        || (this.attributes.temp.martini > this.attributes.maxMartini)) {
        this.attributes.maxMartini = this.attributes.temp.martini;
      }
    }

    // Shaken not stirred
    const martiniSounds = parseInt(process.env.MARTINICOUNT);
    if (!isNaN(martiniSounds) && !this.attributes.bot) {
      const randomValue = seedrandom(this.attributes.temp.martini +
          this.event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
      const choice = 1 + Math.floor(randomValue * martiniSounds);
      if (choice > martiniSounds) {
        choice--;
      }
      speech += `<audio src="https://s3-us-west-2.amazonaws.com/alexasoundclips/baccarat/martini${choice}.mp3"/> `;
    }

    let reprompt = (this.attributes.temp.reprompt ? this.attributes.temp.reprompt : this.t('MARTINI_REPROMPT'));
    reprompt = removeMartini(this, reprompt);
    speech += (this.attributes.temp.coffee ? this.t('MARTINI_DRINK_CALM') : this.t('MARTINI_DRINK')) + reprompt;
    this.attributes.temp.coffee = 0;

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};

function removeMartini(context, text) {
  let newText = text;

  if (text.indexOf(context.t('MARTINI')) > -1) {
    newText = context.t('MARTINI_REPROMPT');
  }

  return newText;
}
