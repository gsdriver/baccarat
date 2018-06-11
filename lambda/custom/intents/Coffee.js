//
// Orders a strong cup of coffee
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    this.attributes.temp.coffee = (this.attributes.temp.coffee + 1) || 1;
    this.attributes.temp.martini = 0;
    utils.emitResponse(this, null, null, this.t('COFFEE_DRINK'), this.t('COFFEE_REPROMPT'));
  },
};
