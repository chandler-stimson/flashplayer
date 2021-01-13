function parse(o) {
  const rtn = {
    href: o.href,
    width: o.width,
    height: o.height
  };
  if (o.object) {
    if (o.object.data) {
      rtn.href = o.object.data;
    }
  }
  if (o.object) {
    const e = o.object.querySelector('[name="movie"]');
    if (e) {
      rtn.href = e.value;
    }
  }
  if (o.object) {
    const e = o.object.querySelector('[name="FlashVars"],[name="flashvars"]');
    if (e) {
      rtn.parameters = e.value;
    }
  }
  if (o.embed && o.embed.src) {
    rtn.href = o.embed.src;
  }
  return rtn;
}

if (document.querySelector('[data-sdfseeds]')) {
  const o = document.querySelector('[data-sdfseeds]');
  delete o.dataset.sdfseeds;
  if (o.tagName === 'EMBED') {
    [{
      embed: o,
      object: o.parentElement && o.parentElement.tagName === 'OBJECT' ? o.parentElement : undefined,
      width: o.width || o.getBoundingClientRect().width,
      height: o.height || o.getBoundingClientRect().height
    }].map(parse)
  }
  else {
    const rtn = {
      object: o
    };
    if (o.querySelector('embed')) {
      rtn.embed = o.querySelector('embed');
      rtn.width = rtn.embed.width || rtn.embed.getBoundingClientRect().width;
      rtn.height = rtn.embed.height || rtn.embed.getBoundingClientRect().height;
    }
    [rtn].map(parse)
  }
}
else {
  [
    ...[...document.querySelectorAll('embed')].map(o => {
      return {
        object: o.parentElement && o.parentElement.tagName === 'OBJECT' ? o.parentElement : undefined,
        embed: o,
        width: o.width || o.getBoundingClientRect().width,
        height: o.height || o.getBoundingClientRect().height
      };
    }),
    ...[...document.querySelectorAll('object')].map(o => {
      const rtn = {
        object: o,
        embed: o.querySelector('embed') ? o.querySelector('embed') : undefined
      };
      if (rtn.embed) {
        rtn.width = rtn.embed.width || rtn.embed.getBoundingClientRect().width,
        rtn.height = rtn.embed.height || rtn.embed.getBoundingClientRect().height
      }
      return rtn;
    }),
    ...[...document.querySelectorAll('a[href*=".swf"]')].map(o => ({
      href: o.href,
      width: 600,
      height: 600
    }))
  ].map(parse).filter(o => o.href).map(o => {
    if (o.href.startsWith('http') || o.href.startsWith('data:')) {
      return o;
    }
    try {
      o.href = new URL(o.href, location.href).href;
    }
    catch (e) {}
    return o;
  })
}

