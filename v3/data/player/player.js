/* global swf2js, RufflePlayer */
'use strict';

const base = document.createElement('base');

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
  let href = args[0].url || args[0];
  if (href.href) {
    href = href.href;
  }

  if (href.startsWith('data:') || href.startsWith('chrome-extension')) {
    return f.apply(this, args);
  }
  else {
    if (href.startsWith('http') === false) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      href = a.href;
    }
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
              'Content-Type': type,
              'referer': base.href
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
};
window.XMLHttpRequest = class {
  constructor() {
    this.responseType = 'arraybuffer';
  }
  open(method, href) {
    this.method = method;
    this.href = href;
  }
  send() {
    if (this.href.startsWith('data:')) {
      f(this.href).then(r => r.arrayBuffer()).then(c => {
        this.readyState = 4;
        this.status = 200;
        this.response = c;
        this.onreadystatechange();
      });
    }
    else {
      if (this.href.startsWith('http') === false) {
        const a = document.createElement('a');
        a.setAttribute('href', this.href);
        this.href = a.href;
      }
      window.fetch(this.href, {
        method: this.method
      }).then(r => r.arrayBuffer()).then(c => {
        this.readyState = 4;
        this.status = 200;
        this.response = c;
        this.onreadystatechange();
      });
    }
  }
};

window.onmessage = e => {
  const request = e.data;
  if (!request) {
    return;
  }

  const player = document.getElementById('player');
  const engines = {
    one() {
      console.info('using ruffle', request);
      const ruffle = RufflePlayer.newest();
      const engine = ruffle.createPlayer();
      player.appendChild(engine);
      // https://github.com/ruffle-rs/ruffle/wiki/Using-Ruffle#configuration-options

      engine.load({
        // 'autoplay': 'on',
        // 'unmuteOverlay': 'hidden',
        'url': request.href,
        'parameters': request.parameters
      });
    },
    two() {
      console.info('using swf2js', request);
      const parameters = {};
      if (request.parameters) {
        const o = new URLSearchParams(request.parameters);
        for (const [key, value] of o) {
          parameters[key] = value;
        }
      }

      swf2js.load(request.href, {
        'tagId': 'player',
        'bgcolor': '#ffffff',
        'FlashVars': parameters
      });
    }
  };
  base.href = request.referer;
  document.head.appendChild(base);

  if (request.engine === 'swf2js') {
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
  else {
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
};

document.ondragstart = e => e.preventDefault();
document.ondragover = e => e.preventDefault();
document.ondrop = e => {
  e.preventDefault();
  const file = [...e.dataTransfer.files].shift();
  const reader = new FileReader();
  reader.onload = () => {
    top.postMessage({
      method: 'file',
      href: reader.result
    }, '*');
  };
  reader.readAsDataURL(file);
};
