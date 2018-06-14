//
// Utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const request = require('request');
const querystring = require('querystring');
const Alexa = require('alexa-sdk');
// utility methods for creating Image and TextField objects
const makeImage = Alexa.utils.ImageUtils.makeImage;
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
  emitResponse: function(context, error, response, speech, reprompt, cardTitle, cardText) {
    const formData = {};

    context.attributes.temp.speech = speech;
    context.attributes.temp.reprompt = reprompt;

    // Async call to save state and logs if necessary
    if (process.env.SAVELOG) {
      const result = (error) ? error : ((response) ? response : speech);
      formData.savelog = JSON.stringify({
        event: this.event,
        result: result,
      });
    }
    if (response || context.attributes.temp.forceSave) {
      formData.savedb = JSON.stringify({
        userId: context.event.session.user.userId,
        attributes: context.attributes,
      });
    }

    if (formData.savelog || formData.savedb) {
      const params = {
        url: process.env.SERVICEURL + 'baccarat/saveState',
        formData: formData,
      };
      request.post(params, (err, res, body) => {
        if (err) {
          console.log(err);
        }
      });
    }

    if (error) {
      const res = require('./' + context.event.request.locale + '/resources');
      console.log('Speech error: ' + error);
      context.response.speak(error)
        .listen(res.strings.ERROR_REPROMPT);
    } else if (response) {
      context.response.speak(response);
    } else if (cardTitle) {
      context.response.speak(speech)
        .listen(reprompt)
        .cardRenderer(cardTitle, cardText);
    } else {
      context.response.speak(speech)
        .listen(reprompt);
    }

    buildDisplayTemplate(context, () => {
      context.emit(':responseReady');
    });
  },
  initializeGame: function(context, game) {
    context.attributes.currentGame = game;
    const newGame = Object.assign(availableGames.basic);

    module.exports.shuffleDeck(newGame, context.event.session.user.userId);
    context.attributes[context.attributes.currentGame] = newGame;
  },
  readLeaderBoard: function(context, callback) {
    const attributes = context.attributes;
    const game = attributes[attributes.currentGame];
    let leaderURL = process.env.SERVICEURL + 'baccarat/leaders';
    let speech = '';
    const params = {};

    params.userId = context.event.session.user.userId;
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
        speech = context.t('LEADER_NO_SCORES');
      } else {
        const leaders = JSON.parse(body);

        if (!leaders.count || !leaders.top) {
          // Something went wrong
          speech = context.t('LEADER_NO_SCORES');
        } else {
          if (leaders.rank) {
            speech += context.t('LEADER_BANKROLL_RANKING')
              .replace('{0}', game.bankroll)
              .replace('{1}', leaders.rank)
              .replace('{2}', roundPlayers(context, leaders.count));
          }

          // And what is the leader board?
          let topScores = leaders.top;
          topScores = topScores.map((x) => context.t('LEADER_BANKROLL_FORMAT').replace('{0}', x));
          speech += context.t('LEADER_TOP_BANKROLLS').replace('{0}', topScores.length);
          speech += speechUtils.and(topScores, {locale: context.event.request.locale, pause: '300ms'});
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
  sayCard: function(context, card) {
    const suits = JSON.parse(context.t('CARD_SUITS'));
    const ranks = context.t('CARD_RANKS').split('|');

    return context.t('CARD_NAME')
      .replace('{0}', ranks[card.rank - 1])
      .replace('{1}', suits[card.suit]);
  },
  sayBetOn: function(context, betOn) {
    const players = JSON.parse(context.t('BETON_OPTIONS'));
    return (players[betOn]) ? players[betOn] : betOn;
  },
  readHand: function(context, readBankroll, callback) {
    let speech = '';
    let reprompt = '';
    const game = context.attributes[context.attributes.currentGame];

    if (readBankroll) {
      speech += context.t('READ_BANKROLL').replace('{0}', game.bankroll);
    }
    if (game.player && game.player.length) {
      // Repeat what they had
      let cards;

      cards = speechUtils.and(game.player.map((x) => module.exports.sayCard(context, x)));
      speech += context.t('READ_OLD_PLAYER_CARDS')
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.player));

      cards = speechUtils.and(game.dealer.map((x) => module.exports.sayCard(context, x)));
      speech += context.t('READ_OLD_DEALER_CARDS')
        .replace('{0}', cards)
        .replace('{1}', module.exports.handTotal(game.dealer));

      reprompt = context.t('BET_PLAY_AGAIN').split('|')[0];
    } else {
      reprompt = context.t('GENERIC_REPROMPT');
    }

    callback(speech, reprompt);
  },
  getBetAmount: function(context, callback) {
    let reprompt;
    let speech;
    let amount;
    let betOn;
    const game = context.attributes[context.attributes.currentGame];

    if (context.event.request.intent.slots && context.event.request.intent.slots.Amount
      && context.event.request.intent.slots.Amount.value) {
      amount = parseInt(context.event.request.intent.slots.Amount.value);
    } else if (game.bet) {
      amount = game.bet;
    } else {
      amount = game.minBet;
    }

    if (context.event.request.intent.slots && context.event.request.intent.slots.Player
      && context.event.request.intent.slots.Player.value) {
      // Force this to player, banker, or tie
      betOn = context.event.request.intent.slots.Player.value.toLowerCase();
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
      speech = context.t('BET_EXCEEDS_MAX').replace('{0}', game.rules.maxBet);
      reprompt = context.t('BET_INVALID_REPROMPT');
    } else if (amount < game.rules.minBet) {
      speech = context.t('BET_LESSTHAN_MIN').replace('{0}', game.rules.minBet);
      reprompt = context.t('BET_INVALID_REPROMPT');
    } else if (amount > game.bankroll) {
      if (game.bankroll >= game.rules.minBet) {
        amount = game.bankroll;
      } else {
        // Oops, you can't bet this much
        speech = context.t('BET_EXCEEDS_BANKROLL').replace('{0}', game.bankroll);
        reprompt = context.t('BET_INVALID_REPROMPT');
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
  pickRandomOption: function(context, res) {
    const game = context.attributes[context.attributes.currentGame];

    if (res && context.t(res)) {
      const options = context.t(res).split('|');
      const randomValue = seedrandom(context.event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
      const choice = Math.floor(randomValue * options.length);
      if (choice == options.length) {
        choice--;
      }

      return options[choice];
    } else {
      return undefined;
    }
  },
};

function buildDisplayTemplate(context, callback) {
  if (context.event.context &&
      context.event.context.System.device.supportedInterfaces.Display) {
    context.attributes.display = true;
    const start = Date.now();
    const game = context.attributes[context.attributes.currentGame];
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

        // Use this as the background image
        const builder = new Alexa.templateBuilders.BodyTemplate6Builder();
        const template = builder.setTitle('')
                    .setBackgroundImage(makeImage(imageUrl))
                    .setBackButtonBehavior('HIDDEN')
                    .build();

        context.response.renderTemplate(template);
        callback();
      }
    });
  } else {
    // Not a display device
    callback();
  }
}

function roundPlayers(context, playerCount) {
  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return context.t('MORE_THAN_PLAYERS').replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}
