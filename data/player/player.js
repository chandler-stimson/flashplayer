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

const f = window.fetch;
window.fetch = function(...args) {
  const href = args[0].url || args[0];

  if (href.startsWith('http')) {
    console.log('fetching', href);
    return new Promise((resolve, reject) => {
      window.onmessage = e => {
        const {content, type, error} = e.data;
        if (error) {
          reject(new Error(error));
        }
        else {
          const response = new Response(content, {
            'status': 200,
            'headers': {
              'Content-Type': type
            }
          });
          resolve(response);
        }
      };
      top.postMessage({
        method: 'fetch',
        href
      }, '*');
    });
  }
  else {
    return f.apply(this, args);
  }
};

window.onmessage = e => {
  const request = e.data;
  const player = document.getElementById('player');
  const engines = {
    one() {
      console.log('using ruffle', request);
      const ruffle = RufflePlayer.newest();
      const engine = ruffle.createPlayer();
      player.appendChild(engine);
      engine.load({
        'url': request.href,
        'parameters': request.parameters
      });
    },
    two() {
      console.log('using swf2js');
      swf2js.load(request.href, {
        'tagId': 'player'
      });
    }
  };
  const base = document.createElement('base');
  base.href = request.origin;
  document.head.appendChild(base);

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
