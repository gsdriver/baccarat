//
// Orders a martini
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    this.attributes.temp.martini = (this.attributes.temp.martini + 1) || 1;
    this.attributes.temp.coffee = 0;
    utils.emitResponse(this, null, null, this.t('MARTINI_DRINK'), this.t('MARTINI_REPROMPT'));
  },
};
