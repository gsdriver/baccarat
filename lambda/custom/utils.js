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
    const res = require('./resources')(handlerInput);
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
        speech = res.getString('LEADER_NO_SCORES');
      } else {
        const leaders = JSON.parse(body);

        if (!leaders.count || !leaders.top) {
          // Something went wrong
          speech = res.getString('LEADER_NO_SCORES');
        } else {
          if (leaders.rank) {
            speech += res.getString('LEADER_BANKROLL_RANKING')
              .replace('{0}', game.bankroll)
              .replace('{1}', leaders.rank)
              .replace('{2}', roundPlayers(handlerInput, leaders.count));
          }

          // And what is the leader board?
          let topScores = leaders.top;
          topScores = topScores.map((x) => res.getString('LEADER_BANKROLL_FORMAT').replace('{0}', x));
          speech += res.getString('LEADER_TOP_BANKROLLS').replace('{0}', topScores.length);
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
  sayCard: function(handlerInput, card) {
    const res = require('./resources')(handlerInput);
    const suits = JSON.parse(res.getString('CARD_SUITS'));
    const ranks = res.getString('CARD_RANKS').split(';');

    return res.getString('CARD_NAME')
      .replace('{0}', ranks[card.rank - 1])
      .replace('{1}', suits[card.suit]);
  },
  sayBetOn: function(handlerInput, betOn) {
    const res = require('./resources')(handlerInput);
    const players = JSON.parse(res.getString('BETON_OPTIONS'));
    return (players[betOn]) ? players[betOn] : betOn;
  },
  readHand: function(handlerInput, readBankroll) {
    const res = require('./resources')(handlerInput);
    let speech = '';
    let reprompt = '';
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    if (readBankroll) {
      speech += res.getString('READ_BANKROLL').replace('{0}', game.bankroll);
    }
    if (game.player && game.player.length) {
      // Repeat what they had
      let cards;

      cards = speechUtils.and(game.player.map((x) => module.exports.sayCard(handlerInput, x)));
      speech += res.getString('READ_OLD_PLAYER_CARDS')
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.player));

      cards = speechUtils.and(game.dealer.map((x) => module.exports.sayCard(handlerInput, x)));
      speech += res.getString('READ_OLD_DEALER_CARDS')
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.dealer));

      reprompt = res.getString('BET_PLAY_AGAIN').split('|')[0];
    } else {
      reprompt = res.getString('GENERIC_REPROMPT');
    }

    return {speech: speech, reprompt: reprompt};
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

function roundPlayers(handlerInput, playerCount) {
  const res = require('./resources')(handlerInput);
  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return res.getString('MORE_THAN_PLAYERS').replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}
