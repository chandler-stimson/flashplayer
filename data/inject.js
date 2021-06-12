{
  const add = e => {
    if (e.dataset.attached !== 'true') {
      if (e.querySelector('.swf2html')) {
        return;
      }
      const span = document.createElement('span');
      span.classList.add('swf2html');
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
        console.log(e);
        chrome.runtime.sendMessage({
          method: 'request-detect'
        });
      };
      e.parentElement.insertBefore(span, e);
      e.dataset.attached = true;
    }
  };

  for (const e of [...document.querySelectorAll('object[type="application/x-shockwave-flash"]')]) {
    add(e);
  }
  for (const e of [...document.querySelectorAll('embed[src*=swf]')]) {
    if (e.parentElement.tagName === 'OBJECT') {
      add(e.parentElement);
    }
    else {
      add(e);
    }
  }
  for (const c of [...document.querySelectorAll('object param[name="movie"]')]) {
    const e = c.parentElement;
    if (e.parentElement.tagName === 'OBJECT') {
      add(e.parentElement);
    }
    else {
      add(e);
    }
  }
}
