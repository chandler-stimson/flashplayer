for (const e of [
  ...document.querySelectorAll('embed[src*=swf]'),
  ...document.querySelectorAll('object[type="application/x-shockwave-flash"]')
]) {
  if (e.dataset.attached !== 'true') {
    const span = document.createElement('span');
    span.textContent = 'Run this Flash';
    span.style = `
      all: initial;
      background-color: #e0e0e0;
      color: #646464;
      padding: 2px 5px;
      display: block;
      cursor: pointer;
      width: min-content;
      white-space: nowrap;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 12px;
      user-select: none;
    `;
    span.onclick = () => {
      [...document.querySelectorAll('[data-sdfseeds]')].forEach(e => delete e.dataset.sdfseeds);
      e.dataset.sdfseeds = true;
      chrome.runtime.sendMessage({
        method: 'request-detect'
      });
    };
    e.parentElement.insertBefore(span, e);
    e.dataset.attached = true;
  }
}
