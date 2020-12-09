/* global swf2js, RufflePlayer */
'use strict';

const cache = {};
Object.defineProperty(window, 'localStorage', {
  value() {
    return {
      getItem(name) {
        return cache[name];
      },
      setItem(name, value) {
        cache[name] = value;
      }
    };
  }
});

window.onmessage = e => {
  const request = e.data;

  const player = document.getElementById('player');
  const engines = {
    one() {
      console.log('using ruffle', request);
      const ruffle = RufflePlayer.newest();
      const engine = ruffle.createPlayer();
      player.appendChild(engine);
      engine.load(request.href);
    },
    two() {
      console.log('using swf2js');
      swf2js.load(request.href, {
        'tagId': 'player'
      });
    }
  };
  if (request.engine === 'ruffle') {
    try {
      engines.one();
    }
    catch (e) {
      console.warn(e);
      try {
        player.textContent = '';
        engines.two();
      }
      catch (e) {
        alert('Emulator crashed!\n\n' + e.message);
      }
    }
  }
  else {
    try {
      engines.two();
    }
    catch (e) {
      console.warn(e);
      try {
        player.textContent = '';
        engines.one();
      }
      catch (e) {
        alert('Emulator crashed!\n\n' + e.message);
      }
    }
  }
};
