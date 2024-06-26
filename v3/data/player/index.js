'use strict';

const args = new URLSearchParams(location.search);
const iframe = document.querySelector('iframe');

function humanFileSize(size) {
  size = parseInt(size);
  if (!size) {
    return size;
  }
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}


const progress = o => {
  const e = document.querySelector('.progress div');
  document.title = `Loading (${humanFileSize(o.loaded)})...`;
  if (o.total) {
    e.style.width = o.loaded / o.total * 100 + '%';
  }
};

const json = JSON.parse(args.get('json'));
iframe.onload = () => {
  if (!iframe.contentWindow) {
    return;
  }
  const run = async () => {
    document.body.dataset.mode = 'loading';
    document.title = 'Fetching ' + json.href;
    const response = await fetch(json.href);
    if (response.ok === false) {
      throw Error('no response');
    }

    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    let loaded = 0;

    const res = new Response(new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          progress({loaded, total});
          controller.enqueue(value);
        }
        controller.close();
      }
    }), {
      'headers': {
        'Content-Type': 'application/x-shockwave-flash'
      }
    });
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = () => {
      document.body.dataset.mode = 'ready';
      chrome.storage.local.get({
        engine: 'ruffle'
      }, prefs => {
        document.title = args.get('title') + ` - FlashPlayer (${prefs.engine} engine)`;

        setTimeout(() => iframe.contentWindow.postMessage({
          engine: prefs.engine,
          href: reader.result,
          parameters: json.parameters,
          origin: json.href,
          referer: json.referer
        }, '*'), 100);
      });
    };
    reader.readAsDataURL(blob);
  };

  if (json.href) {
    run().catch(e => {
      console.warn(e);
      document.title = 'Failed - FlashPlayer';
      alert('Failed to fetch the resource: ' + e.message + '\n\nResource Link:\n' + json.href);
    });
  }
  else {
    document.title = 'Drag an SWF to the window to start rendering';
  }
};

window.addEventListener('message', e => {
  const request = e.data;
  if (request.method === 'fetch') {
    fetch(request.href).then(async r => {
      const content = await r.arrayBuffer();
      iframe.contentWindow.postMessage({
        content,
        type: r.headers.get('Content-Type')
      }, '*');
    }).catch(e => iframe.contentWindow.postMessage({
      error: e.message
    }, '*'));
  }
  else if (request.method === 'file') {
    json.href = request.href;
    iframe.onload();
  }
});
