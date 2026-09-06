/* One routing contract for static pages and navigation injected after load. */
(function () {
  'use strict';
  var production = /^(?:www\.)?kananlabs\.in$|^apply\.kananlabs\.in$/.test(location.hostname);
  var ownHosts = ['kananlabs.in', 'www.kananlabs.in', 'apply.kananlabs.in'];
  function route(link) {
    var raw = link.getAttribute('href');
    if (!raw || /^(?:#|mailto:|tel:|javascript:)/i.test(raw)) return;
    var target;
    try { target = new URL(raw, document.baseURI); } catch (_) { return; }
    if (target.origin !== location.origin && ownHosts.indexOf(target.hostname) < 0) return;
    var supplier = target.hostname === 'apply.kananlabs.in' && /^\/(?:supplier-programme\.html)?$/.test(target.pathname)
      || /^\/(?:supplier-programme|project-origin)(?:\.html)?\/?$/.test(target.pathname);
    if (supplier) {
      target = new URL((production ? 'https://apply.kananlabs.in/' : location.origin + '/supplier-programme.html') + target.search + target.hash);
      if (target.searchParams.get('utm_source') === 'kanan_homepage' && location.pathname !== '/' && location.pathname !== '/index.html') {
        target.searchParams.set('utm_source', 'kanan_' + location.pathname.split('/').filter(Boolean)[0].replace(/\.html$/, ''));
      }
    } else if (production) {
      target = new URL(target.pathname + target.search + target.hash, 'https://kananlabs.in');
    } else {
      target = new URL(target.pathname + target.search + target.hash, location.origin);
    }
    if (link.href !== target.href) link.href = target.href;
  }
  function scan(root) {
    if (root.matches && root.matches('a[href]')) route(root);
    if (root.querySelectorAll) root.querySelectorAll('a[href]').forEach(route);
  }
  scan(document);
  new MutationObserver(function (records) {
    records.forEach(function (record) { record.addedNodes.forEach(scan); });
  }).observe(document.documentElement, {childList:true, subtree:true});
}());
