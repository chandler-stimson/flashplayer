{
  const add = (e, type) => {
    if (e.dataset.attached !== 'true') {
      if (e.querySelector('.swf2html')) {
        return;
      }
      const span = document.createElement('span');
      span.classList.add('swf2html', type);
      span.textContent = 'Run this Flash';
      span.onclick = () => {
        for (const e of document.querySelectorAll('[data-sdfseeds]')) {
          delete e.dataset.sdfseeds;
        }
        e.dataset.sdfseeds = true;
        chrome.runtime.sendMessage({
          method: 'request-detect'
        });
      };
      e.parentElement.insertBefore(span, e);
      e.dataset.attached = true;
    }
  };

  for (const e of document.querySelectorAll('object[type="application/x-shockwave-flash"]')) {
    add(e, 'object');
  }
  for (const e of document.querySelectorAll('embed[src*=swf]')) {
    if (e.parentElement.tagName === 'OBJECT') {
      add(e.parentElement, 'object');
    }
    else {
      add(e, 'embed');
    }
  }
  for (const c of document.querySelectorAll('object param[name="movie"]')) {
    const e = c.parentElement;
    if (e.parentElement.tagName === 'OBJECT') {
      add(e.parentElement, 'object');
    }
    else {
      add(e, 'object');
    }
  }
}
