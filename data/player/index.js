'use strict';

const args = new URLSearchParams(location.search);
const iframe = document.querySelector('iframe');

const progress = o => {
  console.log(o);
  const e = document.querySelector('.progress div');
  if (o.total) {
    e.style.width = o.loaded / o.total * 100 + '%';
  }
};

iframe.onload = async () => {
  if (!iframe.contentWindow) {
    return;
  }
  try {
    const response = await fetch(args.get('href'));
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
      document.title = args.get('title') + ' - FlashPlayer';
      iframe.contentWindow.postMessage(reader.result, '*');
    };
    reader.readAsDataURL(blob);
  }
  catch (e) {
    console.warn(e);
    document.title = 'Failed - FlashPlayer';
    alert('Failed to fetch the resource: ' + e.message);
  }
};
