// Localized resources

// Shared between all languages
const common = {
  // From index.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Help.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Help.',
  // From Exit.js
  'EXIT_GAME': '{0} Goodbye.',
  // From Help.js
  'HELP_TEXT': 'Refer to the Alexa app for the full rules of the game. ',
  'HELP_CARD_TITLE': 'Baccarat Table',
  // From HighScore.js
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // From Launch.js
  'LAUNCH_WELCOME': 'Welcome to Baccarat Table. ',
  'LAUNCH_REPROMPT': 'Say bet to play.',
  // From utils.js
  'MORE_THAN_PLAYERS': 'over {0}',
  'GENERIC_REPROMPT': 'What else can I help with?',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_TOP_BANKROLLS': 'The top {0} bankrolls are ',
  'CARD_RANKS': 'one|two|three|four|five|six|seven|eight|nine|ten|jack|queen|king|ace',
  'CARD_SUITS': '{"C":"clubs","D":"diamonds","H":"hearts","S":"spades"}',
  'CARD_NAME': '{0} of {1}',
};

// Used for dollar-specific languages
const dollar = {
  // From Launch.js
  'LAUNCH_WELCOME_BACK': 'Welcome back to Baccarat Table. You have ${0}. ',
  // From Repeat.js
  'READ_BET': 'You are betting ${0} a hand. ',
  'READ_BANKROLL': 'You have ${0}. ',
  // From utils.js
  'LEADER_BANKROLL_RANKING': 'You have ${0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '${0}',
};

// Same strings as above but with £
const pound = {
  // From Launch.js
  'LAUNCH_WELCOME_BACK': 'Welcome back to Baccarat Table. You have £{0}. ',
  // From Repeat.js
  'READ_BET': 'You are betting £{0} a hand. ',
  'READ_BANKROLL': 'You have £{0}. ',
  // From utils.js
  'LEADER_BANKROLL_RANKING': 'You have £{0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '£{0}',
};

const resources = {
  'en-US': {
    'translation': Object.assign({}, common, dollar),
  },
  'en-GB': {
    'translation': Object.assign({}, common, pound),
  },
};

// Use a proxy in case we are asked for a language not called out above
const handler = {
  get: function(target, name) {
    return target.hasOwnProperty(name) ? target[name] : target['en-US'];
  },
};

module.exports = {
  languageStrings: new Proxy(resources, handler),
};
