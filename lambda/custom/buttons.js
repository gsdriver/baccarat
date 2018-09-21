//
// Echo Button support functions
//

'use strict';

module.exports = {
  playerBetColor: '00008B',
  martiniColor: '90EE90',
  dealerBetColor: 'FFA500',
  supportButtons: function(handlerInput) {
    const localeList = ['en-US', 'en-GB', 'de-DE'];
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const locale = handlerInput.requestEnvelope.request.locale;

    return (!process.env.NOBUTTONS &&
      (localeList.indexOf(locale) >= 0) &&
      (attributes.platform !== 'google') && !attributes.bot);
  },
  getPressedButton: function(request, attributes) {
    const gameEngineEvents = request.events || [];
    let buttonId;

    gameEngineEvents.forEach((engineEvent) => {
      // in this request type, we'll see one or more incoming events
      // corresponding to the StartInputHandler we sent above
      if (engineEvent.name === 'timeout') {
        console.log('Timed out waiting for button');
      } else if (engineEvent.name === 'button_down_event') {
        // save id of the button that triggered event
        console.log('Received button down request');
        buttonId = engineEvent.inputEvents[0].gadgetId;
      }
    });

    return buttonId;
  },
  startInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // We'll allow them to press the button again if we haven't already
      const inputDirective = {
        'type': 'GameEngine.StartInputHandler',
        'timeout': 60000,
        'recognizers': {
          'button_down_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
            }],
          },
        },
        'events': {
          'button_down_event': {
            'meets': ['button_down_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
        },
      };
      handlerInput.responseBuilder.addDirective(inputDirective);
    }
  },
  buildButtonDownAnimationDirective: function(handlerInput, targetGadgets) {
    if (module.exports.supportButtons(handlerInput)) {
      const buttonDownDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': targetGadgets,
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [{
              'durationMs': 500,
              'color': 'FFFF00',
              'intensity': 255,
              'blend': false,
            }],
          }],
          'triggerEvent': 'buttonDown',
          'triggerEventTimeMs': 0,
        },
      };
      handlerInput.responseBuilder.addDirective(buttonDownDirective);
    }
  },
  addLaunchAnimation: function(handlerInput, targetGadgets) {
    if (module.exports.supportButtons(handlerInput)) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();

      // Alternate between blue (player bet), light green (martini), and red (banker bet)
      // Duration of green will vary based on how many martinis they've had!
      const martinis = (attributes.temp.martini) ? attributes.temp.martini : 0;
      const betDuration = Math.max(200, 1000 - martinis * 200);
      const martiniDuration = Math.max(200, martinis * 200);
      const buttonDownDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': targetGadgets,
        'parameters': {
          'animations': [{
            'repeat': 10,
            'targetLights': ['1'],
            'sequence': [
            {
              'durationMs': betDuration,
              'color': module.exports.playerBetColor,
              'intensity': 255,
              'blend': false,
            },
            {
              'durationMs': betDuration,
              'color': module.exports.dealerBetColor,
              'intensity': 255,
              'blend': false,
            },
            {
              'durationMs': martiniDuration,
              'color': module.exports.martiniColor,
              'intensity': 255,
              'blend': false,
            },
            ],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };
      handlerInput.responseBuilder.addDirective(buttonDownDirective);
    }
  },
  turnOffButtons: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      const turnOffButtonDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [
              {
                'durationMs': 400,
                'color': '000000',
                'blend': false,
              },
            ],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      handlerInput.responseBuilder
        .addDirective(turnOffButtonDirective);
    }
  },
  lightPlayer: function(handlerInput, buttonId, buttonColor) {
    if (module.exports.supportButtons(handlerInput)) {
      const buttonIdleDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [buttonId],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      buttonIdleDirective.parameters.animations[0].sequence.push({
        'durationMs': 60000,
        'color': buttonColor,
        'blend': false,
      });
      handlerInput.responseBuilder.addDirective(buttonIdleDirective);
    }
  },
  addRollAnimation: function(handlerInput, duration, playerNumber) {
    if (module.exports.supportButtons(handlerInput)) {
      // Flash the buttons white while the roll is being read
      // Then flash it green or red (based on win or loss)
      // Finally turn on or off based on whether they are the shooter
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const game = attributes[attributes.currentGame];
      let i;

      const buttonDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [game.players[playerNumber].buttonId],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      // First animation - fade to white
      buttonDirective.parameters.animations[0].sequence.push({
        'durationMs': 1000,
        'color': '000000',
        'blend': false,
      });
      buttonDirective.parameters.animations[0].sequence.push({
        'durationMs': duration,
        'color': 'FFFFFF',
        'blend': true,
      });

      // Did this player win or lose (or neither - in which case keep it white)
      let winColor;
      if (game.players[playerNumber].amountWon > 0) {
        winColor = '00FE10';
      } else if (game.players[playerNumber].amountWon < 0) {
        winColor = 'FF0000';
      } else {
        winColor = 'FFFFFF';
      }
      for (i = 0; i < 4; i++) {
        buttonDirective.parameters.animations[0].sequence.push({
          'durationMs': 600,
          'color': winColor,
          'blend': true,
        });
        buttonDirective.parameters.animations[0].sequence.push({
          'durationMs': 400,
          'color': '000000',
          'blend': true,
        });
      }

      // Finally, turn this on or off based on whether you are the shooter
      buttonDirective.parameters.animations[0].sequence.push({
        'durationMs': 60000,
        'color': (game.shooter === playerNumber) ? game.players[playerNumber].buttonColor : '000000',
        'blend': false,
      });
      handlerInput.responseBuilder.addDirective(buttonDirective);
    }
  },
};
