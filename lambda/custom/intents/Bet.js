//
// Handles taking a bet and dealing the cards (one shot)
//

'use strict';

const utils = require('../utils');
const seedrandom = require('seedrandom');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'BetIntent') ||
      (request.intent.name === 'AMAZON.YesIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or the minimum bet
    // The player is also optional - if not present we use the last bet or
    // assume that they want to bet on the player
    const bet = getBetAmount(event, attributes);
    if (bet.speechError) {
      return handlerInput.responseBuilder
        .speak(bet.speechError)
        .reprompt(bet.repromptError)
        .getResponse();
    }

    attributes.temp.newGame = undefined;
    let speech = '';
    const game = attributes[attributes.currentGame];
    if ((game.bet !== bet.amount) || (game.betOn !== bet.betOn)) {
      speech += getDrunkOption(event, attributes, 'BET_CARDS_SAYBET')
          .replace('{0}', bet.amount)
          .replace('{1}', utils.sayBetOn(event, bet.betOn))
          .replace('{2}', Math.floor(bet.amount * 1.75));
    }

    // Save the new bet information
    game.bet = bet.amount;
    game.betOn = bet.betOn;
    game.bankroll -= game.bet;
    game.timestamp = Date.now();
    game.rounds = (game.rounds + 1) || 1;

    // If fewer than 8 cards, shuffle
    if (game.deck.length < 8) {
      utils.shuffleDeck(game, event.session.user.userId);
    }

    // Deal two cards to each player
    game.player = [];
    game.dealer = [];
    game.player.push(game.deck.shift());
    game.dealer.push(game.deck.shift());
    game.player.push(game.deck.shift());
    game.dealer.push(game.deck.shift());

    let playerTotal = utils.handTotal(game.player);
    let dealerTotal = utils.handTotal(game.dealer);

    // Let them know what they got
    speech += getDrunkOption(event, attributes, 'BET_PLAYER_CARDS')
        .replace('{0}', utils.sayCard(event, game.player[0]))
        .replace('{1}', utils.sayCard(event, game.player[1]))
        .replace('{2}', playerTotal)
        .replace('{3}', (playerTotal + 2) % 10)
        .replace('{4}', utils.sayCard(event, game.dealer[0]));
    speech += getDrunkOption(event, attributes, 'BET_DEALER_CARDS')
        .replace('{0}', utils.sayCard(event, game.dealer[0]))
        .replace('{1}', utils.sayCard(event, game.dealer[1]))
        .replace('{2}', dealerTotal);

    // Now, if either player or banker have 8 or 9, then we are done
    if ((playerTotal < 8) && (dealerTotal < 8)) {
      // Does the player hit or stand?
      let playerCard = 0;
      if (playerTotal < 6) {
        game.player.push(game.deck.shift());
        playerCard = game.player[2].rank;
        playerTotal = utils.handTotal(game.player);
        speech += getDrunkOption(event, attributes, 'BET_NEXT_PLAYERCARD')
            .replace('{0}', utils.sayCard(event, game.player[2]))
            .replace('{1}', playerTotal)
            .replace('{2}', utils.sayCard(event, {rank: game.dealer[1].rank, suit: 'H'}));
      } else {
        speech += getDrunkOption(event, attributes, 'BET_PLAYER_STAND');
      }

      // What does the banker do?
      let dealerDraw = false;
      switch (dealerTotal) {
        case 0:
        case 1:
        case 2:
          // Draw no matter what
          dealerDraw = true;
          break;
        case 3:
          // Draw unless third card is an 8
          dealerDraw = (playerCard != 8);
          break;
        case 4:
          // Draw if third card was 2-7 (or none at all)
          dealerDraw = (playerCard == 0) || ((playerCard >= 2) && (playerCard <= 7));
          break;
        case 5:
          // Draw if third card was 4-7 (or none at all)
          dealerDraw = (playerCard == 0) || ((playerCard >= 4) && (playerCard <= 7));
          break;
        case 6:
          // Draw if the third card was 6 or 7
          dealerDraw = (playerCard == 6) || (playerCard == 7);
          break;
        default:
          // Everything else, stand
          break;
      }

      if (dealerDraw) {
        game.dealer.push(game.deck.shift());
        dealerTotal = utils.handTotal(game.dealer);
        speech += getDrunkOption(event, attributes, 'BET_NEXT_DEALERCARD')
            .replace('{0}', utils.sayCard(event, game.dealer[2]))
            .replace('{1}', dealerTotal);
      } else {
        speech += getDrunkOption(event, attributes, 'BET_DEALER_STAND');
      }
    }

    // OK, so ... who won?
    let winner;
    if (dealerTotal > playerTotal) {
      winner = (game.betOn == 'banker');
    } else if (playerTotal > dealerTotal) {
      winner = (game.betOn == 'player');
    } else {
      winner = (game.betOn == 'tie');
    }

    if (winner) {
      if (dealerTotal == playerTotal) {
        game.bankroll += (game.rules.tieBet + 1) * game.bet;
        speech += getDrunkOption(event, attributes, 'BET_WIN_TIE').replace('{0}', game.rules.tieBet * game.bet);
      } else {
        game.bankroll += 2 * game.bet;
        if ((game.betOn == 'banker') && game.rules.commission) {
          // Commission
          game.bankroll -= (game.rules.commission * game.bet);
        }
        speech += getDrunkOption(event, attributes, 'BET_WIN');
      }
    } else if (dealerTotal == playerTotal) {
      // It's a tie and you didn't bet on it - so no winner
      game.bankroll += game.bet;
      speech += getDrunkOption(event, attributes, 'BET_TIE');
    } else {
      speech += getDrunkOption(event, attributes, 'BET_LOSE');
    }

    // Reset bankroll if necessary
    if ((game.bankroll < game.rules.minBet) && game.rules.canReset) {
      game.bankroll = game.startingBankroll;
      speech += res.strings.RESET_BANKROLL.replace('{0}', game.bankroll);
    }

    const reprompt = getDrunkOption(event, attributes, 'BET_PLAY_AGAIN');
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};

function getBetAmount(event, attributes) {
  let reprompt;
  let speech;
  let amount;
  let betOn;
  const game = attributes[attributes.currentGame];
  const res = require('../resources')(event.request.locale);

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

  return({
    amount: amount,
    betOn: betOn,
    speechError: speech,
    repromptError: reprompt,
  });
}

function getDrunkOption(event, attributes, value) {
  const res = require('../resources')(event.request.locale);

  // How many martinis have you had?
  const options = res.strings[value].split('|');
  const martini = attributes.temp.martini;
  let drunkLevel;
  const game = attributes[attributes.currentGame];

  if (process.env.NODRUNKTEXT || !martini) {
    // Spoil sport
    drunkLevel = 0;
  } else {
    // OK, you're drunk
    const randomValue = seedrandom(value + event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
    let j = Math.floor(randomValue * (martini + 1));
    if (j == (martini + 1)) {
      j--;
    }

    // OK, there's a 2 / (martini + 1) chance you'll get each level
    // of drunk text, until you hit the last option - the more drinks
    // you've had, the more likely you'll get drunk text
    drunkLevel = Math.floor(j / 2);
    if (drunkLevel > (options.length - 1)) {
      drunkLevel = options.length - 1;
    }
  }

  return options[drunkLevel];
}
