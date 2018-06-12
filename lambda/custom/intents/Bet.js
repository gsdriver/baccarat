//
// Handles taking a bet and dealing the cards (one shot)
//

'use strict';

const utils = require('../utils');
const seedrandom = require('seedrandom');

module.exports = {
  handleIntent: function() {
    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or the minimum bet
    // The player is also optional - if not present we use the last bet or
    // assume that they want to bet on the player
    utils.getBetAmount(this, (amount, betOn, speechError, repromptError) => {
      if (speechError) {
        utils.emitResponse(this, null, null, speechError, repromptError);
        return;
      }

      let speech = '';
      const game = this.attributes[this.attributes.currentGame];
      if ((game.bet !== amount) || (game.betOn !== betOn)) {
        speech += getDrunkOption(this, 'BET_CARDS_SAYBET')
            .replace('{0}', amount)
            .replace('{1}', utils.sayBetOn(this, betOn))
            .replace('{2}', Math.floor(amount * 1.75));
      }

      // Save the new bet information
      game.bet = amount;
      game.betOn = betOn;
      game.bankroll -= game.bet;
      game.timestamp = Date.now();
      game.rounds = (game.rounds + 1) || 1;

      // If fewer than 8 cards, shuffle
      if (game.deck.length < 8) {
        utils.shuffleDeck(game, this.event.session.user.userId);
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
      speech += getDrunkOption(this, 'BET_PLAYER_CARDS')
          .replace('{0}', utils.sayCard(this, game.player[0]))
          .replace('{1}', utils.sayCard(this, game.player[1]))
          .replace('{2}', playerTotal)
          .replace('{3}', (playerTotal + 2) % 10)
          .replace('{4}', utils.sayCard(this, game.dealer[0]));
      speech += getDrunkOption(this, 'BET_DEALER_CARDS')
          .replace('{0}', utils.sayCard(this, game.dealer[0]))
          .replace('{1}', utils.sayCard(this, game.dealer[1]))
          .replace('{2}', dealerTotal);

      // Now, if either player or banker have 8 or 9, then we are done
      if ((playerTotal < 8) && (dealerTotal < 8)) {
        // Does the player hit or stand?
        let playerCard = 0;
        if (playerTotal < 6) {
          game.player.push(game.deck.shift());
          playerCard = game.player[2].rank;
          playerTotal = utils.handTotal(game.player);
          speech += getDrunkOption(this, 'BET_NEXT_PLAYERCARD')
              .replace('{0}', utils.sayCard(this, game.player[2]))
              .replace('{1}', playerTotal)
              .replace('{2}', utils.sayCard(this, {rank: game.dealer[1].rank, suit: 'H'}));
        } else {
          speech += getDrunkOption(this, 'BET_PLAYER_STAND');
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
          speech += getDrunkOption(this, 'BET_NEXT_DEALERCARD')
              .replace('{0}', utils.sayCard(this, game.dealer[2]))
              .replace('{1}', dealerTotal);
        } else {
          speech += getDrunkOption(this, 'BET_DEALER_STAND');
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
          speech += getDrunkOption(this, 'BET_WIN_TIE').replace('{0}', game.rules.tieBet * game.bet);
        } else {
          game.bankroll += 2 * game.bet;
          if ((game.betOn == 'banker') && game.rules.commission) {
            // Commission
            game.bankroll -= (game.rules.commission * game.bet);
          }
          speech += getDrunkOption(this, 'BET_WIN');
        }
      } else if (dealerTotal == playerTotal) {
        // It's a tie and you didn't bet on it - so no winner
        game.bankroll += game.bet;
        speech += getDrunkOption(this, 'BET_TIE');
      } else {
        speech += getDrunkOption(this, 'BET_LOSE');
      }

      // Reset bankroll if necessary
      if ((game.bankroll < game.rules.minBet) && game.rules.canReset) {
        game.bankroll = game.startingBankroll;
        speech += this.t('RESET_BANKROLL').replace('{0}', game.bankroll);
      }

      const reprompt = getDrunkOption(this, 'BET_PLAY_AGAIN');
      speech += reprompt;
      utils.emitResponse(this, null, null, speech, reprompt);
    });
  },
};

function getDrunkOption(context, value) {
  // How many martinis have you had?
  const options = context.t(value).split('|');
  const martini = context.attributes.temp.martini;
  let drunkLevel;
  const game = context.attributes[context.attributes.currentGame];

  if (process.env.NODRUNKTEXT || !martini) {
    // Spoil sport
    drunkLevel = 0;
  } else {
    // OK, you're drunk
    const randomValue = seedrandom(value + context.event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
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