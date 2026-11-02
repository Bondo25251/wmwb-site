// Renders the status line, retailer buttons and contact link from config.js.
// Runs on every page. No network requests, no storage.
(function () {
  'use strict';
  var C = window.WMWB || {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  // Status line
  var rel = parseDate(C.releaseDate);
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var released = rel ? today >= rel : false;
  var dateText = rel ? rel.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  var status = rel ? (released ? 'Released ' + dateText : 'Pre-order; released ' + dateText) : '';
  each('[data-status]', function (el) { if (status) el.textContent = status; });
  each('[data-status-note]', function (el) { el.hidden = released; });

  // Retailer buttons: first enabled retailer is the primary (solid) button
  var list = Array.isArray(C.retailers) ? C.retailers : [];
  var html = '', primaryDone = false;
  list.forEach(function (r) {
    var live = r && r.enabled && r.url;
    if (live) {
      var cls = primaryDone ? 'btn' : 'btn btn--primary';
      primaryDone = true;
      html += '<a class="' + cls + '" href="' + esc(r.url) + '" rel="noopener">' + esc(r.name) + '</a>';
    } else if (r) {
      html += '<span class="btn btn--soon" aria-disabled="true">' + esc(r.name) + ' <span class="tag">soon</span></span>';
    }
  });
  each('[data-retailers]', function (el) { el.innerHTML = html; });

  // Contact line (hidden unless config has an address)
  each('[data-contact]', function (el) {
    var a = el.querySelector('a');
    if (C.contactEmail && a) { a.href = 'mailto:' + C.contactEmail; el.hidden = false; }
    else { el.hidden = true; }
  });
})();
