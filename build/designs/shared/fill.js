/* Station Sites starting designs: fill the customer's answers into a design.
   Every element with data-slot="key" gets its text from ?key=... in the URL (or from window.SS_DATA when the builder injects it).
   Missing keys keep the sample business already written in the page.
   data-slot-href="tel" or "mailto" also points that link at the value.
   Keys: name, short, line, city, addr, hours, phone, email, date, venue. */
(function(){
  var q = new URLSearchParams(location.search), d = window.SS_DATA || {};
  function val(k){ return d[k] != null ? String(d[k]) : q.get(k); }
  document.querySelectorAll('[data-slot]').forEach(function(el){
    var v = val(el.getAttribute('data-slot'));
    if (v == null || v === '') return;
    el.textContent = v;
    var h = el.getAttribute('data-slot-href');
    if (h === 'tel') el.setAttribute('href', 'tel:' + v.replace(/[^\d+]/g, ''));
    if (h === 'mailto') el.setAttribute('href', 'mailto:' + v);
  });
  var n = val('name'); if (n) document.title = n;
  // in the builder's preview, links never navigate away
  if (q.get('preview') === '1') document.addEventListener('click', function(e){ if (e.target.closest('a')) e.preventDefault(); }, true);
})();
