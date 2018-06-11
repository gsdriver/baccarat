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

module.exports = {
  emitResponse: function(context, error, response, speech, reprompt, cardTitle, cardText) {
    const formData = {};

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
    const newGame = {
      startingBankroll: 5000,
      bankroll: 5000,
      rules: {
        minBet: 5,              // Minimum bet
        maxBet: 1000,           // Maximum bet
        numberOfDecks: 6,       // Number of decks
        canReset: true,         // Can the game be reset
        tieBet: 9,              // Odds payed on tie bet
      },
      player: [],
      dealer: [],
    };

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
      for (rank = 2; rank <= 14; rank++) {
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
  readHand: function(context, readBankroll, callback) {
    let speech = '';
    let reprompt = '';
    const game = context.attributes[context.attributes.currentGame];

    if (readBankroll) {
      speech += context.t('READ_BANKROLL').replace('{0}', game.bankroll);
    }
    if (context.handler.state == 'ATWAR') {
      // Repeat what they have
      speech += context.t('READ_CARDS')
        .replace('{0}', module.exports.sayCard(context, game.player[0]))
        .replace('{1}', module.exports.sayCard(context, game.dealer[0]));
      reprompt = context.t('BET_REPROMPT_WAR');
    } else if (game.player.length) {
      // Repeat what they had
      speech += context.t('READ_OLD_CARDS')
        .replace('{0}', module.exports.sayCard(context, game.player[game.player.length - 1]))
        .replace('{1}', module.exports.sayCard(context, game.dealer[game.dealer.length - 1]));
      reprompt = context.t('BET_PLAY_AGAIN');
    }

    callback(speech, reprompt);
  },
  sayDealtCards: function(context, playerCard, dealerCard, bet) {
    const format = (bet ? context.t('BET_CARDS_SAYBET') : context.t('BET_CARDS'));
    let playerText;
    let dealerText;

    if (playerCard.rank > 10) {
      playerText = module.exports.pickRandomOption(context, 'GOOD_PLAYER_CARD');
    } else if (playerCard.rank < 5) {
      playerText = module.exports.pickRandomOption(context, 'BAD_PLAYER_CARD');
    } else {
      playerText = module.exports.pickRandomOption(context, 'NORMAL_PLAYER_CARD');
    }

    if ((dealerCard.rank > playerCard.rank) && (playerCard.rank > 10)) {
      dealerText = module.exports.pickRandomOption(context, 'DEALER_TOUGH_BEAT');
    } else {
      dealerText = module.exports.pickRandomOption(context, 'DEALER_CARD');
    }

    return format
        .replace('{0}', playerText.replace('{0}', module.exports.sayCard(context, playerCard)))
        .replace('{1}', dealerText.replace('{0}', module.exports.sayCard(context, dealerCard)))
        .replace('{2}', bet);
  },
  getBetAmount: function(context, callback) {
    let reprompt;
    let speech;
    let amount;
    const game = context.attributes[context.attributes.currentGame];

    if (context.event.request.intent.slots && context.event.request.intent.slots.Amount
      && context.event.request.intent.slots.Amount.value) {
      amount = parseInt(context.event.request.intent.slots.Amount.value);
    } else if (game.bet) {
      amount = game.bet;
    } else {
      amount = game.minBet;
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

    callback(amount, speech, reprompt);
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
    let nextCards;

    if ((game.player.length !== 1) || (game.player[0].rank !== game.dealer[0].rank)) {
      nextCards = game.deck.slice(0, 2);
    } else {
      // We're going to burn three if there is a war (assume so)
      nextCards = game.deck.slice(3, 5);
    }

    const formData = {
      dealer: JSON.stringify(game.dealer),
      player: JSON.stringify(game.player),
      nextCards: JSON.stringify(nextCards),
    };
    if (game.activePlayer == 'none') {
      formData.showHoleCard = 'true';
    }

    const params = {
      url: process.env.SERVICEURL + 'war/drawImage',
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
