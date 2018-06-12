//
// Orders a martini
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    if (!this.attributes.temp.coffee) {
      this.attributes.temp.martini = (this.attributes.temp.martini + 1) || 1;
    }

    let reprompt = (this.attributes.temp.reprompt ? this.attributes.temp.reprompt : this.t('MARTINI_REPROMPT'));
    reprompt = removeMartini(this, reprompt);
    const speech = (this.attributes.temp.coffee ? this.t('MARTINI_DRINK_CALM') : this.t('MARTINI_DRINK')) + reprompt;
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
