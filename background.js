'use strict';

const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
});

const open = (o, title) => chrome.storage.local.get({
  width: 800,
  height: 600,
  responsive: true
}, prefs => {
  if (prefs.responsive) {
    prefs.width = o.width || prefs.width;
    prefs.height = o.height || prefs.height;
  }
  const left = screen.availLeft + Math.round((screen.availWidth - prefs.width) / 2);
  const top = screen.availTop + Math.round((screen.availHeight - prefs.height) / 2);

  chrome.windows.create({
    url: chrome.extension.getURL('data/player/index.html?href=' + encodeURIComponent(o.href) + '&title=' + encodeURIComponent(title)),
    width: prefs.width,
    height: prefs.height,
    left,
    top,
    type: 'popup'
  });
});

const search = title => chrome.tabs.executeScript({
  code: `[
    ...[...document.querySelectorAll('embed')].map(o => ({
      href: o.src,
      width: o.width || o.getBoundingClientRect().width,
      height: o.height || o.getBoundingClientRect().height
    })),
    ...[...document.querySelectorAll('object')].map(o => ({
      href: o.data,
      width: o.width || o.getBoundingClientRect().width,
      height: o.height || o.getBoundingClientRect().height
    })),
    ...[...document.querySelectorAll('a[href*=swf]')].map(o => ({
      href: o.href,
      width: 600,
      height: 600
    }))
  ].filter(o => o.href).map(o => {
    if (o.href.startsWith('http') || o.href.startsWith('data:')) {
      return o;
    }
    try {
      o.href = new URL(o.href, location.href).href;
    }
    catch (e) {}
    return o;
  })`,
  runAt: 'document_start',
  allFrames: true,
  matchAboutBlank: true
}, a => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    return notify(lastError);
  }

  const objects = {};
  a.flat().forEach(o => {
    if (o.href) {
      objects[o.href] = o;
    }
  });
  const links = Object.keys(objects);

  if (links.length === 0) {
    notify('No Flash (SWF) content is detected');
  }
  else if (links.length === 1) {
    open(objects[links[0]], title);
  }
  else {
    chrome.tabs.executeScript({
      code: String.raw`{
        const links = ${JSON.stringify(links)};
        prompt('Select a Flash link to start emulation:\n\n' + links.map((s, i) => (i + 1) + ' ' + s).join('\n'), 1);
      }`
    }, ([index]) => {
      if (index) {
        open(objects[links[index] || links[0]], title);
      }
    });
  }
});

chrome.browserAction.onClicked.addListener(tab => search(tab.title));

{
  const startup = () => {
    chrome.contextMenus.create({
      title: 'Find SWF and Open in Emulator',
      id: 'search',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      title: 'Open SWF in Emulator',
      id: 'link',
      contexts: ['link'],
      targetUrlPatterns: ['*://*/*.swf*', '*://*/*.SWF*', '*://*/*.swf', '*://*/*.SWF']
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'search') {
    search(tab.title);
  }
  else if (info.menuItemId === 'link') {
    open({
      width: 600,
      height: 600,
      href: info.linkUrl
    }, tab.title);
  }
});
