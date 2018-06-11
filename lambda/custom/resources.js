// Localized resources

// Shared between all languages
const common = {
  // From index.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Help.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Help.',
  // From Bet.js
  'BET_INVALID_REPROMPT': 'What else can I help you with?',
  'BET_PLAY_AGAIN': 'Would you like to play again? ',
  'BET_PLAYER_CARDS': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> You got {0} and {1} for a total of {2}. ',
  'BET_DEALER_CARDS': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> I got {0} and {1} for a total of {2}. ',
  'BET_NEXT_PLAYERCARD': '<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> You drew a {0} for a total of {1}. ',
  'BET_PLAYER_STAND': '<break time=\'300ms\'/> You stand on this hand. ',
  'BET_NEXT_DEALERCARD': '<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> I drew a {0} for a total of {1}. ',
  'BET_DEALER_STAND': '<break time=\'300ms\'/> I stand on this hand. ',
  'BET_WIN': 'You win! ',
  'BET_LOSE': 'You lost! ',
  'BET_TIE': 'It\'s a tie <break time=\'200ms\'/> no winner. ',
  // From Coffee.js
  'COFFEE_DRINK': 'Nothing like a strong cup of joe. What else can I help you with?',
  'COFFEE_REPROMPT': 'What else can I help you with?',
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
  // From Martini.js
  'MARTINI_DRINK': 'Ah, that hits the spot. What else can I help you with?',
  'MARTINI_REPROMPT': 'What else can I help you with?',
  // From utils.js
  'MORE_THAN_PLAYERS': 'over {0}',
  'GENERIC_REPROMPT': 'What else can I help with?',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_TOP_BANKROLLS': 'The top {0} bankrolls are ',
  'CARD_RANKS': 'ace|two|three|four|five|six|seven|eight|nine|ten|jack|queen|king',
  'CARD_SUITS': '{"C":"clubs","D":"diamonds","H":"hearts","S":"spades"}',
  'CARD_NAME': '{0} of {1}',
  'READ_OLD_PLAYER_CARDS': 'You had {0} for a total of {1}. ',
  'READ_OLD_DEALER_CARDS': 'I had {0} for a total of {1}. ',
  'BETON_OPTIONS': '{"player":"the player","banker":"the banker","tie":"a tie"}',
};

// Used for dollar-specific languages
const dollar = {
  // From Bet.js
  'BET_EXCEEDS_MAX': 'Sorry, this bet exceeds the maximum bet of ${0}.',
  'BET_LESSTHAN_MIN': 'Sorry, this bet is less than the minimum bet of ${0}.',
  'BET_EXCEEDS_BANKROLL': 'Sorry, this bet exceeds your bankroll of ${0}.',
  'BET_CARDS_SAYBET': 'You bet ${0} on {1} ',
  'BET_WIN_TIE': 'You win ${0} on your tie bet! ',
  'RESET_BANKROLL': 'You do not have enough to place the minimum bet. Resetting bankroll to ${0}. ',
  // From Launch.js
  'LAUNCH_WELCOME_BACK': 'Welcome back to Baccarat Table. You have ${0}. ',
  // From Repeat.js
  'READ_BET': 'You are betting ${0} on {1}. ',
  'READ_BANKROLL': 'You have ${0}. ',
  // From utils.js
  'LEADER_BANKROLL_RANKING': 'You have ${0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '${0}',
};

// Same strings as above but with £
const pound = {
  // From Bet.js
  'BET_EXCEEDS_MAX': 'Sorry, this bet exceeds the maximum bet of £{0}.',
  'BET_LESSTHAN_MIN': 'Sorry, this bet is less than the minimum bet of £{0}.',
  'BET_EXCEEDS_BANKROLL': 'Sorry, this bet exceeds your bankroll of £{0}.',
  'BET_CARDS_SAYBET': 'You bet £{0} on {1} ',
  'BET_WIN_TIE': 'You win £{0} on your tie bet! ',
  'RESET_BANKROLL': 'You do not have enough to place the minimum bet. Resetting bankroll to £{0}. ',
  // From Launch.js
  'LAUNCH_WELCOME_BACK': 'Welcome back to Baccarat Table. You have £{0}. ',
  // From Repeat.js
  'READ_BET': 'You are betting £{0} on {1}. ',
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
