//
// Utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const request = require('request');
const querystring = require('querystring');
const speechUtils = require('alexa-speech-utils')();
const seedrandom = require('seedrandom');

const availableGames = {
  'basic': {
    startingBankroll: 5000,
    bankroll: 5000,
    rules: {
      minBet: 5,              // Minimum bet
      maxBet: 1000,           // Maximum bet
      numberOfDecks: 6,       // Number of decks
      canReset: true,         // Can the game be reset
      tieBet: 8,              // Odds payed on tie bet
      commission: 0.05,       // Commission you pay if you bet on banker
   },
 },
};

module.exports = {
  initializeGame: function(event, attributes, game) {
    attributes.currentGame = game;
    const newGame = Object.assign(availableGames.basic);

    module.exports.shuffleDeck(newGame, event.session.user.userId);
    attributes[attributes.currentGame] = newGame;
  },
  readLeaderBoard: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('./resources')(event.request.locale);
    let leaderURL = process.env.SERVICEURL + 'baccarat/leaders';
    let speech = '';
    const params = {};

    params.userId = event.session.user.userId;
    params.score = game.bankroll;
    params.game = attributes.currentGame;

    const paramText = querystring.stringify(params);
    if (paramText.length) {
      leaderURL += '?' + paramText;
    }

    request(
      {
        uri: leaderURL,
        method: 'GET',
        timeout: 1000,
      }, (err, response, body) => {
      if (err) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        const leaders = JSON.parse(body);

        if (!leaders.count || !leaders.top) {
          // Something went wrong
          speech = res.strings.LEADER_NO_SCORES;
        } else {
          if (leaders.rank) {
            speech += res.strings.LEADER_BANKROLL_RANKING
              .replace('{0}', game.bankroll)
              .replace('{1}', leaders.rank)
              .replace('{2}', roundPlayers(event, leaders.count));
          }

          // And what is the leader board?
          let topScores = leaders.top;
          topScores = topScores.map((x) => res.strings.LEADER_BANKROLL_FORMAT.replace('{0}', x));
          speech += res.strings.LEADER_TOP_BANKROLLS.replace('{0}', topScores.length);
          speech += speechUtils.and(topScores, {locale: event.request.locale, pause: '300ms'});
        }
      }

      callback(speech);
    });
  },
  shuffleDeck: function(game, userId) {
    let i;
    let rank;
    const start = Date.now();

    game.deck = [];
    const suits = ['C', 'D', 'H', 'S'];
    for (i = 0; i < game.rules.numberOfDecks; i++) {
      for (rank = 1; rank <= 13; rank++) {
        suits.map((item) => {
          game.deck.push({'rank': rank, 'suit': item});
        });
      }
    }

    // Shuffle using the Fisher-Yates algorithm
    for (i = 0; i < game.deck.length - 1; i++) {
      const randomValue = seedrandom(i + userId + (game.timestamp ? game.timestamp : ''))();
      let j = Math.floor(randomValue * (game.deck.length - i));
      if (j == (game.deck.length - i)) {
        j--;
      }
      j += i;
      const tempCard = game.deck[i];
      game.deck[i] = game.deck[j];
      game.deck[j] = tempCard;
    }

    console.log('Shuffle took ' + (Date.now() - start) + ' ms');
  },
  sayCard: function(event, card) {
    const res = require('./resources')(event.request.locale);
    const suits = JSON.parse(res.strings.CARD_SUITS);
    const ranks = res.strings.CARD_RANKS.split('|');

    return res.strings.CARD_NAME
      .replace('{0}', ranks[card.rank - 1])
      .replace('{1}', suits[card.suit]);
  },
  sayBetOn: function(event, betOn) {
    const res = require('./resources')(event.request.locale);
    const players = JSON.parse(res.strings.BETON_OPTIONS);
    return (players[betOn]) ? players[betOn] : betOn;
  },
  readHand: function(event, attributes, readBankroll, callback) {
    const res = require('./resources')(event.request.locale);
    let speech = '';
    let reprompt = '';
    const game = attributes[attributes.currentGame];

    if (readBankroll) {
      speech += res.strings.READ_BANKROLL.replace('{0}', game.bankroll);
    }
    if (game.player && game.player.length) {
      // Repeat what they had
      let cards;

      cards = speechUtils.and(game.player.map((x) => module.exports.sayCard(event, x)));
      speech += res.strings.READ_OLD_PLAYER_CARDS
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.player));

      cards = speechUtils.and(game.dealer.map((x) => module.exports.sayCard(event, x)));
      speech += res.strings.READ_OLD_DEALER_CARDS
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.dealer));

      reprompt = res.strings.BET_PLAY_AGAIN.split('|')[0];
    } else {
      reprompt = res.strings.GENERIC_REPROMPT;
    }

    callback(speech, reprompt);
  },
  getBetAmount: function(event, attributes, callback) {
    let reprompt;
    let speech;
    let amount;
    let betOn;
    const game = attributes[attributes.currentGame];
    const res = require('./resources')(event.request.locale);

    if (event.request.intent.slots && event.request.intent.slots.Amount
      && event.request.intent.slots.Amount.value) {
      amount = parseInt(event.request.intent.slots.Amount.value);
    } else if (game.bet) {
      amount = game.bet;
    } else {
      amount = game.minBet;
    }

    if (event.request.intent.slots && event.request.intent.slots.Player
      && event.request.intent.slots.Player.value) {
      // Force this to player, banker, or tie
      betOn = event.request.intent.slots.Player.value.toLowerCase();
      if (betOn == 'dealer') {
        betOn = 'banker';
      } else if ((betOn != 'banker') && (betOn != 'tie')) {
        betOn = 'player';
      }
    } else if (game.betOn) {
      betOn = game.betOn;
    } else {
      betOn = 'player';
    }

    // If we didn't get the amount, just make it a minimum bet
    if (isNaN(amount) || (amount == 0)) {
      amount = game.rules.minBet;
    }

    if (amount > game.rules.maxBet) {
      speech = res.strings.BET_EXCEEDS_MAX.replace('{0}', game.rules.maxBet);
      reprompt = res.strings.BET_INVALID_REPROMPT;
    } else if (amount < game.rules.minBet) {
      speech = res.strings.BET_LESSTHAN_MIN.replace('{0}', game.rules.minBet);
      reprompt = res.strings.BET_INVALID_REPROMPT;
    } else if (amount > game.bankroll) {
      if (game.bankroll >= game.rules.minBet) {
        amount = game.bankroll;
      } else {
        // Oops, you can't bet this much
        speech = res.strings.BET_EXCEEDS_BANKROLL.replace('{0}', game.bankroll);
        reprompt = res.strings.BET_INVALID_REPROMPT;
      }
    }

    callback(amount, betOn, speech, reprompt);
  },
  handTotal: function(cards) {
    // Total is between 0 and 9
    let total = 0;
    cards.forEach((card) => {
      if (card.rank < 10) {
        total += card.rank;
      }
    });

    return (total % 10);
  },
  drawTable: function(handlerInput, callback) {
    const response = handlerInput.responseBuilder;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

callback();
return;

    if (event.context && event.context.System &&
      event.context.System.device &&
      event.context.System.device.supportedInterfaces &&
      event.context.System.device.supportedInterfaces.Display) {
      attributes.display = true;
      const start = Date.now();
      const game = attributes[attributes.currentGame];
      const nextCards = game.deck.slice(0, 6);

      const formData = {
        dealer: game.dealer ? JSON.stringify(game.dealer) : '[]',
        player: game.player ? JSON.stringify(game.player) : '[]',
        nextCards: JSON.stringify(nextCards),
      };
      if (game.activePlayer == 'none') {
        formData.showHoleCard = 'true';
      }

      const params = {
        url: process.env.SERVICEURL + 'baccarat/drawImage',
        formData: formData,
        timeout: 3000,
      };

      request.post(params, (err, res, body) => {
        if (err) {
          console.log(err);
          callback(err);
        } else {
          const imageUrl = JSON.parse(body).file;
          const end = Date.now();
          console.log('Drawing table took ' + (end - start) + ' ms');

          response.addRenderTemplateDirective({
            type: 'BodyTemplate6',
            backButton: 'HIDDEN',
            backgroundImage: {sources: [{url: imageUrl, widthPixels: 0, heightPixels: 0}]},
            title: '',
          });

          callback();
        }
      });
    } else {
      // Not a display device
      callback();
    }
  },
};

function roundPlayers(event, playerCount) {
  const res = require('./resources')(event.request.locale);
  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return res.strings.MORE_THAN_PLAYERS.replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}
