// Localized resources

// Shared between all languages
const common = {
  // From index.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Help.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Help.',
  // From Bet.js
  'BET_INVALID_REPROMPT': 'What else can I help you with?',
  'BET_PLAY_AGAIN': 'Would you like to play again? |Would you like to play again? |Would you like to play again? Or if you\'re feeling tipsy say order some coffee. ',
  'BET_PLAYER_CARDS': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> The player got {0} and {1} for a total of {2}. |<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> {0} plus {1} makes {2} <break time=\'300ms\'/> or {3}? |<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> {0} <break time=\'200ms\'/> or {4} <break time=\'300ms\'/> and is that a {1}? Is that {2} or {3}? |<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> Some cards in front of me? <break time=\'400ms\'/>Are we playing blackjack?  <break time=\'200ms\'/> I need some coffee. ',
  'BET_DEALER_CARDS': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> The banker got {0} and {1} for a total of {2}. ',
  'BET_NEXT_PLAYERCARD': '<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> Player draws a {0} for a total of {1}. |<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> a {0} makes {1}. |<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> another card? <break time=\'200ms\'/> Is that {0} or {2}? I think that makes {1}. |<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> Did I ask for another card? <break time=\'200ms\'/> Is that blackjack? I need some coffee. ',
  'BET_PLAYER_STAND': '<break time=\'300ms\'/> The player stands on this hand. |<break time=\'300ms\'/> Player stands on this hand. |<break time=\'300ms\'/> I think I\'m good on this one. ',
  'BET_NEXT_DEALERCARD': '<break time=\'400ms\'/> <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> Banker draws a {0} for a total of {1}. ',
  'BET_DEALER_STAND': '<break time=\'300ms\'/> The banker stands on this hand. ',
  'BET_WIN': 'You win! |You win! |Oh, more money! |Why are there more chips? ',
  'BET_LOSE': 'You lost! |You lost! |Where did my money go? ',
  'BET_TIE': 'It\'s a tie <break time=\'200ms\'/> no winner. |It\'s a tie <break time=\'200ms\'/> no winner. |Wait, what happened? ',
  // From Coffee.js
  'COFFEE_DRINK': 'Nothing like a strong cup of joe. ',
  'COFFEE_DRINK_SOBER': 'Whew, that cleared my head. ',
  'COFFEE_REPROMPT': 'What else can I help you with?',
  'COFFEE': 'coffee',
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
  'LAUNCH_SOBER': 'The break did you good <break time=\'200ms\'/> your head is cleared up. ',
  // From Martini.js
  'MARTINI_DRINK': 'Ah, that hits the spot. ',
  'MARTINI_DRINK_CALM': 'Ah, that calms my nerves. ',
  'MARTINI_REPROMPT': 'What else can I help you with?',
  'MARTINI': 'martini',
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
  'BET_CARDS_SAYBET': 'You bet ${0} on {1} |${0} on {1} I think |${0} <break time=\'100ms\'/> ${2}? <break time=\'300ms\'/> {1}? ',
  'BET_WIN_TIE': 'You win ${0} on your tie bet! |You win ${0} on your tie bet! |Wait, there\'s more chips in front of me. ',
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
  'BET_CARDS_SAYBET': 'You bet £{0} on {1} |£{0} on {1} I think |£{0} <break time=\'100ms\'/> £{2}? <break time=\'300ms\'/> {1}? ',
  'BET_WIN_TIE': 'You win £{0} on your tie bet! ',
  'RESET_BANKROLL': 'You do not have enough to place the minimum bet. Resetting bankroll to £{0}. ',
  // From Help.js
  'HELP_CARD_TEXT': 'You can bet between £{0} and £{1} per round by saying BET and the amount you want to bet. You can also specify whether you want to bet on the player, banker, or tie (for example - BET £20 ON THE PLAYER). If you bet on the player hand and win it pays even money, betting on the banker hand results in a 5% commission, and betting on a tie hand pays {4} to 1.\nPoint values for cards are 0 for tens and face cards, 1 for aces, and the point value for 2-9. To get the total for a hand, you add the values of the cards in the hand and take the right digit to get a value between 0 and 9. For example, a 5 and a 7 would be a total of 2.\nBoth players are dealt two cards and the dealer automatically plays both hands. If either hand totals 8 or 9, the round is over immediately. Otherwise, if the player has a total of 0-5, they draw otherwise they stay.\nThe banker\'s action is a little more complex. If the player stood, the banker hits on a total of 0-5, and stands on 6 or 7. Otherwise:\n  - Total of 0-2, the banker draws\n  - Total of 3, banker draws unless the player\'s third card is 8\n  - Total of 4, banker draws if the player\'s third card is 2-7\n  - Total of 5, banker draws if the player\'s third card was 4-7\n  - Total of 6, banker draws if the player\'s third card was 6-7\n  - Total of 7, banker stands\nSay READ HIGH SCORES to hear the leader board.\nGood luck!',
  // From Launch.js
  'LAUNCH_WELCOME_BACK': 'Welcome back to Baccarat Table. You have £{0}. ',
  // From Repeat.js
  'READ_BET': 'You are betting £{0} on {1}. ',
  'READ_BANKROLL': 'You have £{0}. ',
  // From utils.js
  'LEADER_BANKROLL_RANKING': 'You have £{0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '£{0}',
};

// Help is different thanks to martini laws
const martini = {
  // From Help.js
  'HELP_CARD_TEXT': 'You can bet between ${0} and ${1} per round by saying BET and the amount you want to bet. You can also specify whether you want to bet on the player, banker, or tie (for example - BET $20 ON THE PLAYER). If you bet on the player hand and win it pays even money, betting on the banker hand results in a 5% commission, and betting on a tie hand pays {4} to 1.\nPoint values for cards are 0 for tens and face cards, 1 for aces, and the point value for 2-9. To get the total for a hand, you add the values of the cards in the hand and take the right digit to get a value between 0 and 9. For example, a 5 and a 7 would be a total of 2.\nBoth players are dealt two cards and the dealer automatically plays both hands. If either hand totals 8 or 9, the round is over immediately. Otherwise, if the player has a total of 0-5, they draw otherwise they stay.\nThe banker\'s action is a little more complex. If the player stood, the banker hits on a total of 0-5, and stands on 6 or 7. Otherwise:\n  - Total of 0-2, the banker draws\n  - Total of 3, banker draws unless the player\'s third card is 8\n  - Total of 4, banker draws if the player\'s third card is 2-7\n  - Total of 5, banker draws if the player\'s third card was 4-7\n  - Total of 6, banker draws if the player\'s third card was 6-7\n  - Total of 7, banker stands\nSay READ HIGH SCORES to hear the leader board.\nYou can also ORDER A MARTINI to get into the spirit of the game, or ORDER A COFFEE if you\'ve had too much.\nGood luck!',
};

const noMartini = {
  // From Help.js
  'HELP_CARD_TEXT': 'You can bet between ${0} and ${1} per round by saying BET and the amount you want to bet. You can also specify whether you want to bet on the player, banker, or tie (for example - BET $20 ON THE PLAYER). If you bet on the player hand and win it pays even money, betting on the banker hand results in a 5% commission, and betting on a tie hand pays {4} to 1.\nPoint values for cards are 0 for tens and face cards, 1 for aces, and the point value for 2-9. To get the total for a hand, you add the values of the cards in the hand and take the right digit to get a value between 0 and 9. For example, a 5 and a 7 would be a total of 2.\nBoth players are dealt two cards and the dealer automatically plays both hands. If either hand totals 8 or 9, the round is over immediately. Otherwise, if the player has a total of 0-5, they draw otherwise they stay.\nThe banker\'s action is a little more complex. If the player stood, the banker hits on a total of 0-5, and stands on 6 or 7. Otherwise:\n  - Total of 0-2, the banker draws\n  - Total of 3, banker draws unless the player\'s third card is 8\n  - Total of 4, banker draws if the player\'s third card is 2-7\n  - Total of 5, banker draws if the player\'s third card was 4-7\n  - Total of 6, banker draws if the player\'s third card was 6-7\n  - Total of 7, banker stands\nSay READ HIGH SCORES to hear the leader board.\nGood luck!',
};

const resources = {
  'en-US': {
    'translation': Object.assign({}, common, dollar, martini),
  },
  'en-AU': {
    'translation': Object.assign({}, common, dollar, noMartini),
  },
  'en-IN': {
    'translation': Object.assign({}, common, dollar, noMartini),
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
