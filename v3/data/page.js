// const script = document.createElement('script');
// script.textContent = `
//   navigator.plugins['Shockwave Flash'] = {
//     name: 'Shockwave Flash',
//     description: 'Shockwave Flash 23.0 r0',
//     filename: 'Flsh Player.plgin'
//   };
//   swfobject = {
//     embedSWF(href, id, width = 300, height = 100) {
//       const embed = document.createElement('embed');
//       embed.src = href;
//       embed.width = width;
//       embed.height = height;
//       const e = document.getElementById(id);
//       if (e) {
//         e.appendChild(embed);
//       }
//     },
//     hasFlashPlayerVersion() {
//       return true;
//     },
//     ua: {
//       pv: [100, 0, 0]
//     }
//   }
// `;
// document.documentElement.appendChild(script);
// script.remove();

document.addEventListener('DOMContentLoaded', () => {
  const e = document.querySelector('embed[src*=swf],object[type="application/x-shockwave-flash"],param[name="movie"]');
  if (e) {
    chrome.runtime.sendMessage({
      method: 'detect-objects'
    });
  }
});
