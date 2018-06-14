//
// Orders a strong cup of coffee
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    if (!this.attributes.temp.martini) {
      this.attributes.temp.coffee = (this.attributes.temp.coffee + 1) || 1;
      if (!this.attributes.maxCoffee || (this.attributes.temp.coffee > this.attributes.maxCoffee)) {
        this.attributes.maxCoffee = this.attributes.temp.coffee;
      }
    }

    let reprompt = (this.attributes.temp.reprompt ? this.attributes.temp.reprompt : this.t('COFFEE_REPROMPT'));
    reprompt = removeCoffee(this, reprompt);
    const speech = (this.attributes.temp.martini ? this.t('COFFEE_DRINK_SOBER') : this.t('COFFEE_DRINK')) + reprompt;
    this.attributes.temp.martini = 0;

    utils.emitResponse(this, null, null, speech, reprompt);
  },
};

function removeCoffee(context, text) {
  let newText = text;

  if (text.indexOf(context.t('COFFEE')) > -1) {
    newText = context.t('COFFEE_REPROMPT');
  }

  return newText;
}
