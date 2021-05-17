'use strict';

// https://www.permadi.com/tutorial/flashVars/index.html
// http://nekogames.jp/g2.html?gid=PRM
// https://web.archive.org/web/20030608075418/http://www.chuckecheese.com/cec2002/funstation/
// https://www.newgrounds.com/portal/view/498969
// https://revision.madrevision.com/bowman2/
// https://armorgames.com/play/2267/warfare-1917
// https://www.meninasjogos.com.br/vista-barbie-de-princesa-disney/

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
  let width = prefs.width;
  let height = prefs.height;
  if (prefs.responsive) {
    width = parseInt(o.width || prefs.width);
    height = parseInt(o.height || prefs.height);
  }
  if (isNaN(width)) {
    width = prefs.width;
  }
  if (isNaN(height)) {
    height = prefs.height;
  }
  width = Math.max(width, 400);
  height = Math.max(height, 400);
  const left = screen.availLeft + Math.round((screen.availWidth - prefs.width) / 2);
  const top = screen.availTop + Math.round((screen.availHeight - prefs.height) / 2);

  delete o.width;
  delete o.height;
  chrome.windows.create({
    url: chrome.extension.getURL('data/player/index.html?json=' + encodeURIComponent(JSON.stringify(o)) + '&title=' + encodeURIComponent(title)),
    width,
    height,
    left,
    top,
    type: 'popup'
  });
});

const search = title => chrome.tabs.executeScript({
  file: 'data/detect.js',
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
      objects[o.href] = {
        ...(objects[o.href] || {}),
        ...o
      };
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
      if (!index) {
        return;
      }
      index = Number(index);
      if (isNaN(index) === false) {
        open(objects[links[index - 1] || links[0]], title);
      }
    });
  }
});

chrome.browserAction.onClicked.addListener(tab => search(tab.title));
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'request-detect') {
    search(sender.tab.title);
  }
});

{
  const startup = () => {
    chrome.contextMenus.create({
      title: 'Find SWF and Open in Emulator',
      id: 'search',
      contexts: ['page'],
      documentUrlPatterns: ['*://*/*']
    });
    chrome.contextMenus.create({
      title: 'Open SWF in Emulator',
      id: 'link',
      contexts: ['link'],
      targetUrlPatterns: ['*://*/*.swf*', '*://*/*.SWF*', '*://*/*.swf', '*://*/*.SWF'],
      documentUrlPatterns: ['*://*/*']
    });
    chrome.contextMenus.create({
      title: 'Directly Inject "Ruffle" to This Page',
      id: 'inject-ruffle',
      contexts: ['browser_action'],
      enabled: false
    });
    chrome.storage.local.get({
      engine: 'ruffle'
    }, prefs => {
      chrome.contextMenus.create({
        title: 'Use "SWF2JS" Engine',
        id: 'use-swf2js',
        contexts: ['browser_action'],
        type: 'radio',
        checked: prefs.engine === 'swf2js'
      });
      chrome.contextMenus.create({
        title: 'Use "Ruffle" Engine',
        id: 'use-ruffle',
        contexts: ['browser_action'],
        type: 'radio',
        checked: prefs.engine === 'ruffle'
      });
      chrome.contextMenus.create({
        title: 'Restart the Extension',
        id: 'restart',
        contexts: ['browser_action']
      });
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'restart') {
    chrome.runtime.reload();
  }
  else if (info.menuItemId.startsWith('use-')) {
    chrome.storage.local.set({
      engine: info.menuItemId.replace('use-', '')
    });
  }
  else if (info.menuItemId === 'search') {
    search(tab.title);
  }
  else if (info.menuItemId === 'link') {
    open({
      width: 600,
      height: 600,
      href: info.linkUrl
    }, tab.title);
  }
  else if (info.menuItemId === 'inject-ruffle') {
    chrome.tabs.executeScript(tab.id, {
      file: 'data/player/ruffle/ruffle.js',
      runAt: 'document_start'
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  const rule = {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        css: [
          'embed[src*=swf],object[type="application/x-shockwave-flash"],param[name="movie"]'
        ]
      })
    ],
    actions: [new chrome.declarativeContent.RequestContentScript({
      allFrames: true,
      matchAboutBlank: true,
      js: ['/data/inject.js']
    })]
  };
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([rule]);
  });
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 90;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
