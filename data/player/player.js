/* global swf2js */
'use strict';

window.onmessage = e => {
  try {
    swf2js.load(e.data, {
      'tagId': 'player'
    });
  }
  catch (e) {
    alert('Emulator crashed!\n\n' + e.message);
  }
};
