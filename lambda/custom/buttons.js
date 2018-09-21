//
// Echo Button support functions
//

'use strict';

const PLAYER_BET_COLOR = '00008B'; // Blue
const MARTINI_BET_COLOR = '90EE90'; // Green
const DEALER_BET_COLOR = 'FFA500'; // Red

module.exports = {
  supportButtons: function(handlerInput) {
    const localeList = ['en-US', 'en-GB', 'de-DE'];
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const locale = handlerInput.requestEnvelope.request.locale;

    return (!process.env.NOBUTTONS &&
      (localeList.indexOf(locale) >= 0) &&
      (attributes.platform !== 'google') && !attributes.bot);
  },
  getPressedButton: function(request) {
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
  getButtonIntent: function(request) {
    const gameEngineEvents = request.events || [];
    const events = ['bet_player_event', 'bet_banker_event', 'order_martini_event'];
    let event;

    gameEngineEvents.forEach((engineEvent) => {
      // in this request type, we'll see one or more incoming events
      // corresponding to the StartInputHandler we sent above
      if (events.indexOf(engineEvent.name) > -1) {
        console.log('Received ' + engineEvent.name);
        event = engineEvent.name;
      }
    });

    return event;
  },
  stopInputHandler: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (attributes.temp.inputHandlerRequestId) {
      handlerInput.responseBuilder.addDirective({
        'type': 'GameEngine.StopInputHandler',
        'originatingRequestId': attributes.temp.inputHandlerRequestId,
      });
    }
  },
  startInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // We'll allow them to press the button again if we haven't already
      const request = handlerInput.requestEnvelope.request;
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const inputDirective = {
        'type': 'GameEngine.StartInputHandler',
        'timeout': 30000,
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
      attributes.temp.inputHandlerRequestId = request.requestId;
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
  addLaunchAnimation: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // Flash the buttons white a few times
      // Then place them all in a steady white state
      const buttonIdleDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [],
        'parameters': {
          'animations': [{
            'repeat': 100,
            'targetLights': ['1'],
            'sequence': [{
              'durationMs': 400,
              'color': 'FFFFFF',
              'blend': true,
            },
            {
              'durationMs': 300,
              'color': '000000',
              'blend': true,
            }],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };
      handlerInput.responseBuilder.addDirective(buttonIdleDirective);
    }
  },
  betInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // At this point they should have pressed a button to start the game
      const request = handlerInput.requestEnvelope.request;
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const inputDirective = {
        'type': 'GameEngine.StartInputHandler',
        'timeout': 30000,
        'recognizers': {
          'bet_player_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'gadgetIds': [attributes.temp.buttonId],
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
              'colors': [PLAYER_BET_COLOR],
            }],
          },
          'bet_banker_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'gadgetIds': [attributes.temp.buttonId],
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
              'colors': [DEALER_BET_COLOR],
            }],
          },
          'order_martini_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'gadgetIds': [attributes.temp.buttonId],
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
              'colors': [MARTINI_BET_COLOR],
            }],
          },
        },
        'events': {
          'bet_player_event': {
            'meets': ['bet_player_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
          'bet_banker_event': {
            'meets': ['bet_banker_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
          'order_martini_event': {
            'meets': ['order_martini_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
        },
      };
      handlerInput.responseBuilder.addDirective(inputDirective);
      attributes.temp.inputHandlerRequestId = request.requestId;
    }
  },
  addBetAnimation: function(handlerInput, targetGadgets) {
    if (module.exports.supportButtons(handlerInput)) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();

      // Alternate between blue (player bet), light green (martini), and red (banker bet)
      // Duration of green will vary based on how many martinis they've had!
      const martinis = (attributes.temp.martini) ? attributes.temp.martini : 0;
      const betDuration = Math.max(200, 1600 - martinis * 200);
      const martiniDuration = 400 + (martinis * 200);
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
              'color': PLAYER_BET_COLOR,
              'intensity': 255,
              'blend': false,
            },
            {
              'durationMs': betDuration,
              'color': DEALER_BET_COLOR,
              'intensity': 255,
              'blend': false,
            },
            ],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      if (attributes.canHaveMartini) {
        buttonDownDirective.parameters.animations[0].sequence.push({
          'durationMs': martiniDuration,
          'color': MARTINI_BET_COLOR,
          'intensity': 255,
          'blend': false,
        });
      }

      handlerInput.responseBuilder.addDirective(buttonDownDirective);
    }
  },
  colorButton: function(handlerInput, buttonId, buttonColor) {
    if (module.exports.supportButtons(handlerInput)) {
      const buttonColorDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [buttonId],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [{
                'durationMs': 60000,
                'color': buttonColor,
                'blend': false,
              }],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      handlerInput.responseBuilder.addDirective(buttonColorDirective);
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
};
