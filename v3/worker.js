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
}, notificationId => {
  setTimeout(() => chrome.notifications.clear(notificationId), 3000);
});

const open = (o, title) => chrome.storage.local.get({
  width: 800,
  height: 600,
  responsive: true
}, async prefs => {
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

  const win = await chrome.windows.getCurrent();

  const left = win.left + Math.round((win.width - prefs.width) / 2);
  const top = win.top + Math.round((win.height - prefs.height) / 2);

  delete o.width;
  delete o.height;

  chrome.windows.create({
    url: '/data/player/index.html?json=' + encodeURIComponent(JSON.stringify(o)) + '&title=' + encodeURIComponent(title),
    width,
    height,
    left,
    top,
    type: 'popup'
  });
});

const search = async (tab, frameId, c) => {
  try {
    const target = {
      tabId: tab.id
    };
    if (frameId) {
      target.frameIds = [frameId];
    }
    else {
      target.allFrames = true;
    }
    const r = await chrome.scripting.executeScript({
      target,
      files: ['data/detect.js']
    });

    const objects = {};
    r.map(o => o.result).flat().forEach(o => {
      const href = o.href;

      if (href) {
        objects[href] = {
          ...(objects[href] || {}),
          ...o
        };
      }
    });

    const links = Object.keys(objects);
    if (links.length === 0) {
      return notify('No Flash (SWF) content is detected');
    }

    if (c) {
      c(links);
    }
    else {
      if (links.length === 1) {
        open(objects[links[0]], tab.title);
      }
      else {
        const r = await chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: links => {
            return prompt('Select the Flash resource to start emulator with:\n\n' + links.map((s, i) => (i + 1) + ' ' + s).join('\n'), 1);
          },
          args: [links]
        });
        const index = r[0].result;
        if (index) {
          const n = Number(index);
          if (isNaN(n) === false) {
            open(objects[links[n - 1] || links[0]], tab.title);
          }
        }
      }
    }
  }
  catch (e) {
    console.warn(e);
    notify(e);
  }
};

chrome.action.onClicked.addListener(tab => search(tab));
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'request-detect') {
    search(sender.tab, sender.frameId);
  }
  else if (request.method === 'detect-objects') {
    chrome.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        allFrames: true
      },
      files: ['data/inject.js']
    }).catch(notify);
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
      title: 'Load all embedded SWF objects',
      id: 'inject-ruffle',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      title: 'Open Empty Emulator (Local SWF)',
      id: 'open-empty',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      title: 'Copy SWF URL(s) to Clipboard',
      id: 'copy',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      title: 'Open Test Flash Page',
      id: 'test',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      title: 'Engine',
      id: 'engine',
      contexts: ['action']
    });
    chrome.storage.local.get({
      engine: 'ruffle'
    }, prefs => {
      chrome.contextMenus.create({
        title: 'Use "SWF2JS" Engine',
        id: 'use-swf2js',
        contexts: ['action'],
        type: 'radio',
        checked: prefs.engine === 'swf2js',
        parentId: 'engine'
      });
      chrome.contextMenus.create({
        title: 'Use "Ruffle" Engine',
        id: 'use-ruffle',
        contexts: ['action'],
        type: 'radio',
        checked: prefs.engine === 'ruffle',
        parentId: 'engine'
      });
    });
    chrome.contextMenus.create({
      title: 'Restart the Extension',
      id: 'restart',
      contexts: ['action']
    });
  };
  chrome.runtime.onInstalled.addListener(startup);
}
const onClicked = (info, tab) => {
  if (info.menuItemId === 'copy') {
    search(tab, undefined, links => {
      if (links.length) {
        notify(`Copying ${links.length} links to the clipboard`);
        chrome.tabs.update(tab.id, {
          active: true
        }, () => chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: links => {
            window.focus();
            navigator.clipboard.writeText(links.join('\n')).catch(e => alert(e.message));
          },
          args: [links]
        }).catch(notify));
      }
      else {
        notify('No Flash link is detected!');
      }
    });
  }
  else if (info.menuItemId === 'test') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/test-flash-player/',
      index: tab.index + 1
    });
  }
  else if (info.menuItemId === 'restart') {
    chrome.runtime.reload();
  }
  else if (info.menuItemId.startsWith('use-')) {
    chrome.storage.local.set({
      engine: info.menuItemId.replace('use-', '')
    });
  }
  else if (info.menuItemId === 'search') {
    search(tab);
  }
  else if (info.menuItemId === 'link') {
    open({
      width: 600,
      height: 600,
      href: info.linkUrl
    }, tab.title);
  }
  else if (info.menuItemId === 'inject-ruffle') {
    chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      func: src => {
        const s = document.createElement('script');
        s.src = src;
        document.body.appendChild(s);
        s.onload = () => {
          for (const e of [...document.querySelectorAll('.swf2html')]) {
            e.remove();
          }
        };
      },
      args: [chrome.runtime.getURL('/data/player/ruffle/ruffle.js')]
    }).catch(notify);
  }
  else if (info.menuItemId === 'open-empty') {
    open({}, 'Local SWF');
  }
};
chrome.contextMenus.onClicked.addListener(onClicked);
chrome.commands.onCommand.addListener(menuItemId => chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
}, tabs => onClicked({
  menuItemId
}, tabs[0])));

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
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
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
